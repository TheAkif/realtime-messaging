import 'styles/rb-wordmark.css';

const RabtWordmark = ({ onNavy = false }) => (
	<div className={`rb-wordmark${onNavy ? ' rb-wordmark--on-navy' : ''}`}>
		<span className='rb-mark'>
			<span />
			<span />
			<span />
		</span>
		Rabt
	</div>
);

export default RabtWordmark;
