import RabtWordmark from 'components/RabtWordmark';

const NoConversationSelected = () => (
	<div className="rt-thread-pane">
		<div className="rt-empty-state">
			<RabtWordmark />
			<span className="rt-empty-body">
				Your messages live here. Pick a thread on the left to catch up.
			</span>
		</div>
	</div>
);

export default NoConversationSelected;
