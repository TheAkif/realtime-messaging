const NoConversations = ({ onNewMessage }) => (
	<div className="rt-empty-state">
		<span className="rt-empty-icon" aria-hidden="true">
			+
		</span>
		<span className="rt-empty-title">No conversations yet</span>
		<span className="rt-empty-body">Start one with someone you like talking to.</span>
		<button type="button" className="rt-empty-cta" onClick={onNewMessage}>
			New message
		</button>
	</div>
);

export default NoConversations;
