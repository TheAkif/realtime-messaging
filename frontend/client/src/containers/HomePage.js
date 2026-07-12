import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import landingShot from 'assets/landing-hero-screenshot.png';
import 'styles/tokens.css';
import 'styles/home.css';

const HomePage = () => {
	const { isAuthenticated } = useSelector(state => state.user);

	if (isAuthenticated) return <Navigate to='/chat' />;

	return (
		<>
			<Helmet>
				<title>RealTime | 1:1 messaging, nothing else</title>
				<meta
					name='description'
					content='A fast, quiet place for one-to-one conversations. No feeds, no channels, no noise.'
				/>
			</Helmet>
			<div className='rt-home-page'>
				<header className='rt-home-topbar'>
					<div className='rt-home-wordmark'>
						<span>RealTime</span>
						<span className='rt-home-wordmark-dot' />
					</div>
					<nav className='rt-home-nav'>
						<Link to='/login' className='rt-home-signin-link'>
							Sign in
						</Link>
						<Link to='/register' className='rt-home-create-btn'>
							Create account
						</Link>
					</nav>
				</header>

				<main className='rt-home-hero'>
					<span className='rt-home-kicker'>1:1 MESSAGING, NOTHING ELSE</span>
					<h1 className='rt-home-headline'>
						Talk to your people,
						<br />
						not to an inbox.
					</h1>
					<p className='rt-home-lede'>
						RealTime is a fast, quiet place for one-to-one conversations. No feeds, no
						channels, no noise — just the people you actually talk to.
					</p>
					<Link to='/register' className='rt-home-cta'>
						Start a conversation
					</Link>
					<div className='rt-home-shot-frame'>
						<img src={landingShot} alt='RealTime chat interface showing a conversation' />
					</div>
				</main>
			</div>
		</>
	);
};

export default HomePage;
