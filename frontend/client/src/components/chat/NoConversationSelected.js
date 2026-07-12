const NoConversationSelected = () => (
	<div className="rt-thread-pane">
		<div className="rt-empty-state">
			<span className="rt-empty-wordmark">
				Rabt
				<span className="rt-wordmark-dot" aria-hidden="true" />
			</span>
			<span className="rt-empty-body">
				Your messages live here. Pick a thread on the left to catch up.
			</span>
		</div>
	</div>
);

export default NoConversationSelected;
