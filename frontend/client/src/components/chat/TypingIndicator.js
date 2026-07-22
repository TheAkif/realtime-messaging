import Avatar from './Avatar';

const TypingIndicator = ({ contact }) => (
	<div className="rt-typing-row" aria-label={`${contact.first_name} is typing`}>
		<Avatar
			userId={contact.id}
			firstName={contact.first_name}
			lastName={contact.last_name}
			photoUrl={contact.avatar}
			size="thread"
		/>
		<div className="rt-typing-bubble">
			<span className="rt-typing-dot" />
			<span className="rt-typing-dot" />
			<span className="rt-typing-dot" />
		</div>
	</div>
);

export default TypingIndicator;
