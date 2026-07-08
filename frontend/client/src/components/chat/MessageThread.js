import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ThreadSkeleton from './ThreadSkeleton';
import { groupMessages } from 'utils/groupMessages';

const MessageThread = ({
	messages,
	pendingMessages,
	loading,
	myUserId,
	contact,
	isContactTyping,
}) => {
	const logRef = useRef(null);
	const allMessages = [...messages, ...pendingMessages];
	const items = groupMessages(allMessages, myUserId);
	const lastMessage = allMessages[allMessages.length - 1];
	const showOwnStatus = lastMessage && lastMessage.sender === myUserId;

	useEffect(() => {
		if (logRef.current) {
			logRef.current.scrollTop = logRef.current.scrollHeight;
		}
	}, [allMessages.length, isContactTyping]);

	if (loading) {
		return <ThreadSkeleton />;
	}

	return (
		<div
			ref={logRef}
			role="log"
			aria-live="polite"
			aria-label={`Messages with ${contact.first_name} ${contact.last_name}`}
			className="rt-message-log"
		>
			{items.map((item) =>
				item.type === 'divider' ? (
					<div key={item.key} className="rt-day-divider">
						{item.label}
					</div>
				) : (
					<MessageBubble key={item.key} item={item} contact={contact} />
				)
			)}

			{showOwnStatus && (
				<div className="rt-read-receipt">
					{lastMessage.pending ? (
						<span className="rt-sending-pulse">Sending…</span>
					) : lastMessage.read ? (
						'Read'
					) : (
						'Delivered'
					)}
				</div>
			)}

			{isContactTyping && <TypingIndicator contact={contact} />}
		</div>
	);
};

export default MessageThread;
