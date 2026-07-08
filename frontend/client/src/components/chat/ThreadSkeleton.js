const WIDTHS = [190, 250, 210, 150, 270];

const ThreadSkeleton = () => (
	<div className="rt-skeleton-log" aria-label="Loading conversation">
		{WIDTHS.map((width, i) => (
			<span
				key={i}
				className={`rt-skeleton-bubble${i % 3 === 2 ? ' is-sent' : ''}`}
				style={{ width, animationDelay: `${i * 0.15}s` }}
			/>
		))}
	</div>
);

export default ThreadSkeleton;
