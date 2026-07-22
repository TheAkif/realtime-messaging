import Avatar from './Avatar';

const BackIcon = () => (
	<svg className="rt-svg-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
		<path d="m15 18-6-6 6-6" />
	</svg>
);

const MoreIcon = () => (
	<svg className="rt-svg-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
		<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
		<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
		<circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
	</svg>
);

const ChatHeader = ({ contact, onBack, presence }) => (
	<div className="rt-chat-header">
		<button
			type="button"
			aria-label="Back to conversations"
			className="rt-back-btn"
			onClick={onBack}
		>
			<BackIcon />
		</button>
		<Avatar
			userId={contact.id}
			firstName={contact.first_name}
			lastName={contact.last_name}
			photoUrl={contact.avatar}
			size="header"
			presence={presence === 'online'}
		/>
		<div className="rt-header-meta">
			<span className="rt-header-name">
				{contact.first_name} {contact.last_name}
			</span>
			{presence && (
				<span className={`rt-header-presence${presence === 'online' ? ' is-online' : ''}`}>
					<span className="rt-header-presence-dot" aria-hidden="true" />
					{presence === 'online' ? 'Active now' : 'Offline'}
				</span>
			)}
		</div>
		<button type="button" aria-label="Conversation options" className="rt-options-btn">
			<MoreIcon />
		</button>
	</div>
);

export default ChatHeader;
