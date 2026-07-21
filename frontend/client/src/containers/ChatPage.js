import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
	getConversations,
	getChatHistory,
	getWsTicket,
	logout,
	receiveLiveMessage,
	markConversationRead,
	themeChanged,
	syncThemePreference,
	presenceChanged,
	messagesMarkedRead,
	typingStatusChanged,
} from 'features/user';
import { WS_URL } from 'config';
import Sidebar from 'components/chat/Sidebar';
import ChatHeader from 'components/chat/ChatHeader';
import MessageThread from 'components/chat/MessageThread';
import Composer from 'components/chat/Composer';
import ConnectionBanner from 'components/chat/ConnectionBanner';
import NoConversationSelected from 'components/chat/NoConversationSelected';
import 'styles/tokens.css';
import 'styles/chat.css';

const TYPING_SEND_THROTTLE_MS = 2000;
const TYPING_CLEAR_TIMEOUT_MS = 3000;
const RECONNECT_DELAY_MS = 2000;
const SOCKET_ERROR_DISPLAY_MS = 4000;

const ChatPage = () => {
	const dispatch = useDispatch();
	const {
		isAuthenticated,
		user,
		loading,
		historyLoading,
		conversations,
		chatHistory,
		theme,
		presenceByContactId,
		typingByContactId,
	} = useSelector(state => state.user);

	const [activeChatUser, setActiveChatUser] = useState(null);
	const [message, setMessage] = useState('');
	const [wsStatus, setWsStatus] = useState('disconnected');
	const [pendingMessages, setPendingMessages] = useState([]);
	const [justReconnectedCount, setJustReconnectedCount] = useState(0);
	const [socketErrorMessage, setSocketErrorMessage] = useState(null);

	// Whether the open conversation's contact is typing is just a read of
	// the same per-contact map the sidebar uses - no separate local state.
	const isContactTyping = activeChatUser ? !!typingByContactId[activeChatUser.id] : false;

	const ws = useRef(null);
	const reconnectTimeoutRef = useRef(null);
	// One pending clear-timeout per contact currently typing, keyed by
	// their user id - typing is transient per sender, not a single flag.
	const typingTimeoutsRef = useRef({});
	const socketErrorTimeoutRef = useRef(null);
	const lastTypingSentAtRef = useRef(0);
	const pendingIdRef = useRef(0);
	const pendingMessagesRef = useRef([]);
	// The socket now lives for the whole session, not for whichever
	// conversation is open, so handlers registered once at connect time
	// (onmessage, onopen) need a way to read "what's open right now"
	// without going stale - a ref, same as pendingMessagesRef below.
	const activeChatUserRef = useRef(null);
	const userRef = useRef(null);

	useEffect(() => {
		pendingMessagesRef.current = pendingMessages;
	}, [pendingMessages]);

	useEffect(() => {
		activeChatUserRef.current = activeChatUser;
	}, [activeChatUser]);

	useEffect(() => {
		userRef.current = user;
	}, [user]);

	useEffect(() => {
		dispatch(getConversations());
	}, [dispatch]);

	const handleToggleTheme = () => {
		const next = theme === 'dark' ? 'light' : 'dark';
		dispatch(themeChanged(next));
		dispatch(syncThemePreference(next));
	};

	const closeSocket = useCallback(() => {
		clearTimeout(reconnectTimeoutRef.current);
		if (ws.current) {
			ws.current.onclose = null;
			ws.current.close();
			ws.current = null;
		}
	}, []);

	const showSocketError = useCallback((msg) => {
		clearTimeout(socketErrorTimeoutRef.current);
		setSocketErrorMessage(msg);
		socketErrorTimeoutRef.current = setTimeout(
			() => setSocketErrorMessage(null),
			SOCKET_ERROR_DISPLAY_MS
		);
	}, []);

	// One connection for the whole session: opened once we know who's
	// logged in, kept alive across every conversation the user opens, and
	// only torn down on logout/unmount.
	const connectWebSocket = useCallback(async () => {
		let ticket;
		try {
			ticket = await getWsTicket();
		} catch (err) {
			console.error('Could not start chat session:', err);
			showSocketError('Could not start chat session. Try refreshing the page.');
			return;
		}

		const socket = new WebSocket(`${WS_URL}/ws/chat/?ticket=${ticket}`);
		ws.current = socket;

		socket.onopen = () => {
			setWsStatus('connected');
			// Read the queue from a ref, and send as a plain side effect
			// here rather than inside a setState updater - React 18
			// StrictMode deliberately invokes functional updaters twice
			// in dev to catch impurities, which would double-send here.
			const toFlush = pendingMessagesRef.current;
			if (toFlush.length > 0) {
				toFlush.forEach(p =>
					socket.send(JSON.stringify({ message: p.content, receiver_id: p.receiver }))
				);
				setJustReconnectedCount(toFlush.length);
				setTimeout(() => setJustReconnectedCount(0), 3000);
				pendingMessagesRef.current = [];
				setPendingMessages([]);
			}
		};

		socket.onmessage = (e) => {
			const data = JSON.parse(e.data);
			const currentUser = userRef.current;
			const activeContact = activeChatUserRef.current;

			if (data.error) {
				showSocketError(data.error);
				return;
			}

			if (data.type === 'presence') {
				dispatch(presenceChanged({ userId: data.user_id, status: data.status }));
				return;
			}

			if (data.type === 'read') {
				// Only relevant if I'm currently looking at my conversation
				// with the person who just read my messages.
				if (data.reader_id === activeContact?.id) {
					dispatch(messagesMarkedRead({ myUserId: currentUser.id }));
				}
				return;
			}

			if (data.type === 'typing') {
				// Shown wherever that contact appears - the open thread and
				// the sidebar row both just read this same map.
				dispatch(typingStatusChanged({ userId: data.sender, isTyping: true }));
				clearTimeout(typingTimeoutsRef.current[data.sender]);
				typingTimeoutsRef.current[data.sender] = setTimeout(() => {
					dispatch(typingStatusChanged({ userId: data.sender, isTyping: false }));
					delete typingTimeoutsRef.current[data.sender];
				}, TYPING_CLEAR_TIMEOUT_MS);
				return;
			}

			if (data.type === 'message') {
				// Who this exchange is with, from my perspective - my own
				// echoed-back sends have `sender === me`, so the "other
				// party" is the receiver in that case, and vice versa.
				const otherPartyId = data.sender === currentUser.id ? data.receiver : data.sender;
				const isActiveConversation = activeContact?.id === otherPartyId;

				// Whoever just sent a message is, by definition, done typing.
				clearTimeout(typingTimeoutsRef.current[data.sender]);
				delete typingTimeoutsRef.current[data.sender];
				dispatch(typingStatusChanged({ userId: data.sender, isTyping: false }));

				dispatch(
					receiveLiveMessage({
						otherPartyId,
						isActiveConversation,
						viewerId: currentUser.id,
						message: {
							id: `live-${data.sender}-${data.timestamp}`,
							sender: data.sender,
							receiver: data.receiver,
							content: data.message,
							timestamp: data.timestamp,
							read: false,
						},
					})
				);
			}
		};

		socket.onclose = (e) => {
			if (e.code === 4401 || e.code === 4404) {
				setWsStatus('disconnected');
				return;
			}
			setWsStatus('reconnecting');
			reconnectTimeoutRef.current = setTimeout(connectWebSocket, RECONNECT_DELAY_MS);
		};
	}, [dispatch, showSocketError]);

	useEffect(() => {
		if (!user?.id) return;
		connectWebSocket();
		return closeSocket;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	useEffect(() => {
		return () => {
			Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
		};
	}, []);

	if (!isAuthenticated && !loading && user === null) return <Navigate to="/login" />;

	const handleSelectConversation = (conversation) => {
		setActiveChatUser(conversation);
		setMessage('');
		setPendingMessages([]);
		dispatch(getChatHistory(conversation.id));
		dispatch(markConversationRead(conversation.id));
	};

	const handleBack = () => {
		setActiveChatUser(null);
		dispatch(getConversations());
	};

	const handleSendMessage = () => {
		const content = message.trim();
		if (!content) return;
		setMessage('');

		if (wsStatus === 'connected' && ws.current) {
			ws.current.send(JSON.stringify({ message: content, receiver_id: activeChatUser.id }));
		} else {
			pendingIdRef.current += 1;
			setPendingMessages(prev => [
				...prev,
				{
					id: `pending-${pendingIdRef.current}`,
					sender: user.id,
					receiver: activeChatUser.id,
					content,
					timestamp: new Date().toISOString(),
					pending: true,
				},
			]);
		}
	};

	const handleTyping = () => {
		if (wsStatus !== 'connected' || !ws.current) return;
		const now = Date.now();
		if (now - lastTypingSentAtRef.current > TYPING_SEND_THROTTLE_MS) {
			lastTypingSentAtRef.current = now;
			ws.current.send(JSON.stringify({ type: 'typing', receiver_id: activeChatUser.id }));
		}
	};

	const handleLogout = () => {
		closeSocket();
		dispatch(logout());
	};

	return (
		<>
			<Helmet>
				<title>Rabt | Chat</title>
				<meta name="description" content="Chat page" />
			</Helmet>
			<div className="rt-app" data-mobile-view={activeChatUser ? 'thread' : 'list'}>
				<Sidebar
					conversations={conversations}
					activeChatUser={activeChatUser}
					typingByContactId={typingByContactId}
					presenceByContactId={presenceByContactId}
					onSelect={handleSelectConversation}
					theme={theme}
					onToggleTheme={handleToggleTheme}
					currentUser={user || {}}
					onLogout={handleLogout}
				/>
				{activeChatUser ? (
					<div className="rt-thread-pane" style={{ position: 'relative' }}>
						<ConnectionBanner
							status={wsStatus}
							justReconnectedCount={justReconnectedCount}
							errorMessage={socketErrorMessage}
						/>
						<ChatHeader
							contact={activeChatUser}
							onBack={handleBack}
							presence={presenceByContactId[activeChatUser.id]}
						/>
						<MessageThread
							messages={chatHistory || []}
							pendingMessages={pendingMessages}
							loading={historyLoading}
							myUserId={user?.id}
							contact={activeChatUser}
							isContactTyping={isContactTyping}
						/>
						<Composer
							contact={activeChatUser}
							value={message}
							onChange={setMessage}
							onSend={handleSendMessage}
							onTyping={handleTyping}
						/>
					</div>
				) : (
					<NoConversationSelected />
				)}
			</div>
		</>
	);
};

export default ChatPage;
