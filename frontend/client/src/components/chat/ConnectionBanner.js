const ConnectionBanner = ({ status, justReconnectedCount, errorMessage }) => {
	if (errorMessage) {
		return (
			<div className="rt-banner-wrap">
				<div role="status" className="rt-banner rt-banner--warn">
					<span className="rt-banner-dot" aria-hidden="true" />
					<span className="rt-banner-title">{errorMessage}</span>
				</div>
			</div>
		);
	}

	if (status === 'reconnecting') {
		return (
			<div className="rt-banner-wrap">
				<div role="status" className="rt-banner rt-banner--warn">
					<span className="rt-banner-dot" aria-hidden="true" />
					<span className="rt-banner-title">Reconnecting…</span>
					<span className="rt-banner-subtext">keep typing, we'll send when you're back</span>
				</div>
			</div>
		);
	}

	if (justReconnectedCount) {
		return (
			<div className="rt-banner-wrap">
				<div role="status" className="rt-banner rt-banner--ok">
					<span className="rt-banner-dot" aria-hidden="true" />
					<span className="rt-banner-title">Back online</span>
					<span className="rt-banner-subtext">
						{justReconnectedCount} message{justReconnectedCount === 1 ? '' : 's'} sent
					</span>
				</div>
			</div>
		);
	}

	return null;
};

export default ConnectionBanner;
