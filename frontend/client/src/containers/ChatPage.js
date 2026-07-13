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
	const { isAuthenticated, user, loading, historyLoading, conversations, chatHistory, theme } =
		useSelector(state => state.user);

	const [activeChatUser, setActiveChatUser] = useState(null);
	const [message, setMessage] = useState('');
	const [wsStatus, setWsStatus] = useState('disconnected');
	const [pendingMessages, setPendingMessages] = useState([]);
	const [justReconnectedCount, setJustReconnectedCount] = useState(0);
	const [isContactTyping, setIsContactTyping] = useState(false);
	const [socketErrorMessage, setSocketErrorMessage] = useState(null);

	const ws = useRef(null);
	const reconnectTimeoutRef = useRef(null);
	const typingClearTimeoutRef = useRef(null);
	const socketErrorTimeoutRef = useRef(null);
	const lastTypingSentAtRef = useRef(0);
	const pendingIdRef = useRef(0);
	const pendingMessagesRef = useRef([]);

	useEffect(() => {
		pendingMessagesRef.current = pendingMessages;
	}, [pendingMessages]);

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

	const connectWebSocket = useCallback(
		async (contact) => {
			let ticket;
			try {
				ticket = await getWsTicket();
			} catch (err) {
				console.error('Could not start chat session:', err);
				showSocketError('Could not start chat session. Try selecting the conversation again.');
				return;
			}

			const socket = new WebSocket(`${WS_URL}/ws/chat/${contact.chat_uuid}/?ticket=${ticket}`);
			ws.current = socket;

			socket.onopen = () => {
				setWsStatus('connected');
				// Read the queue from a ref, and send as a plain side effect
				// here rather than inside a setState updater - React 18
				// StrictMode deliberately invokes functional updaters twice
				// in dev to catch impurities, which would double-send here.
				const toFlush = pendingMessagesRef.current;
				if (toFlush.length > 0) {
					toFlush.forEach(p => socket.send(JSON.stringify({ message: p.content })));
					setJustReconnectedCount(toFlush.length);
					setTimeout(() => setJustReconnectedCount(0), 3000);
					pendingMessagesRef.current = [];
					setPendingMessages([]);
				}
			};

			socket.onmessage = (e) => {
				const data = JSON.parse(e.data);

				if (data.error) {
					showSocketError(data.error);
					return;
				}

				if (data.type === 'typing') {
					setIsContactTyping(true);
					clearTimeout(typingClearTimeoutRef.current);
					typingClearTimeoutRef.current = setTimeout(
						() => setIsContactTyping(false),
						TYPING_CLEAR_TIMEOUT_MS
					);
					return;
				}

				if (data.type === 'message') {
					setIsContactTyping(false);
					dispatch(
						receiveLiveMessage({
							contactId: contact.id,
							message: {
								id: `live-${data.sender}-${data.timestamp}`,
								sender: data.sender,
								receiver: data.sender === user.id ? contact.id : user.id,
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
				reconnectTimeoutRef.current = setTimeout(
					() => connectWebSocket(contact),
					RECONNECT_DELAY_MS
				);
			};
		},
		[dispatch, user, showSocketError]
	);

	useEffect(() => closeSocket, [closeSocket]);

	if (!isAuthenticated && !loading && user === null) return <Navigate to="/login" />;

	const handleSelectConversation = (conversation) => {
		closeSocket();
		setActiveChatUser(conversation);
		setMessage('');
		setPendingMessages([]);
		setIsContactTyping(false);
		setWsStatus('disconnected');
		dispatch(getChatHistory(conversation.id));
		dispatch(markConversationRead(conversation.id));
		connectWebSocket(conversation);
	};

	const handleBack = () => {
		closeSocket();
		setActiveChatUser(null);
		dispatch(getConversations());
	};

	const handleSendMessage = () => {
		const content = message.trim();
		if (!content) return;
		setMessage('');

		if (wsStatus === 'connected' && ws.current) {
			ws.current.send(JSON.stringify({ message: content }));
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
			ws.current.send(JSON.stringify({ type: 'typing' }));
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
					typingFromUserId={isContactTyping ? activeChatUser?.id : null}
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
						<ChatHeader contact={activeChatUser} onBack={handleBack} />
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
