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
	// The most recent message I sent always shows its status, even without
	// hovering - every other bubble's status reveals on hover, same as its
	// timestamp.
	const ownMessages = allMessages.filter(m => m.sender === myUserId);
	const latestOwnMessageId = ownMessages.length
		? ownMessages[ownMessages.length - 1].id
		: null;

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
					<MessageBubble
						key={item.key}
						item={item}
						contact={contact}
						isLatestOwn={item.message.id === latestOwnMessageId}
					/>
				)
			)}

			{isContactTyping && <TypingIndicator contact={contact} />}
		</div>
	);
};

export default MessageThread;
