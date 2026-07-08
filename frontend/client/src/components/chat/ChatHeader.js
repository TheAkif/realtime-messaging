import Avatar from './Avatar';

const ChatHeader = ({ contact, onBack }) => (
	<div className="rt-chat-header">
		<button
			type="button"
			aria-label="Back to conversations"
			className="rt-back-btn"
			onClick={onBack}
		>
			‹
		</button>
		<Avatar
			userId={contact.id}
			firstName={contact.first_name}
			lastName={contact.last_name}
			size="header"
		/>
		<div className="rt-header-meta">
			<span className="rt-header-name">
				{contact.first_name} {contact.last_name}
			</span>
		</div>
		<button type="button" aria-label="Conversation options" className="rt-options-btn">
			···
		</button>
	</div>
);

export default ChatHeader;
