import Avatar from './Avatar';
import { conversationTimeFor } from 'utils/chatFormat';

const ConversationRow = ({ conversation, isActive, isTyping, onSelect }) => {
	const { id, first_name, last_name, last_message, unread_count } = conversation;
	const hasUnread = unread_count > 0;

	return (
		<button
			type="button"
			className="rt-conversation-row"
			aria-current={isActive ? 'true' : undefined}
			onClick={() => onSelect(conversation)}
		>
			<Avatar userId={id} firstName={first_name} lastName={last_name} size="list" />
			<span className="rt-conversation-meta">
				<span className="rt-conversation-top">
					<span className="rt-conversation-name">
						{first_name} {last_name}
					</span>
					{last_message && (
						<span className="rt-conversation-time">
							{conversationTimeFor(last_message.timestamp)}
						</span>
					)}
				</span>
				<span className="rt-conversation-bottom">
					{isTyping ? (
						<span className="rt-conversation-typing">typing…</span>
					) : (
						<span
							className={`rt-conversation-preview ${hasUnread ? 'is-unread' : 'is-read'}`}
						>
							{last_message ? last_message.content : 'Say hello 👋'}
						</span>
					)}
					{hasUnread && <span className="rt-unread-badge">{unread_count}</span>}
				</span>
			</span>
		</button>
	);
};

export default ConversationRow;
