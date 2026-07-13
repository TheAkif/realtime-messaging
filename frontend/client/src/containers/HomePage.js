import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import RabtWordmark from 'components/RabtWordmark';
import 'styles/rb-tokens.css';
import 'styles/home.css';

const HomePage = () => {
	const { isAuthenticated } = useSelector(state => state.user);

	if (isAuthenticated) return <Navigate to='/chat' />;

	return (
		<>
			<Helmet>
				<title>Rabt | Real-time messaging</title>
				<meta
					name='description'
					content='Rabt is Urdu for connection. A no-frills chat app built on WebSockets: instant delivery, live typing indicators, and a theme that follows you across devices.'
				/>
			</Helmet>
			<div className='rb-home-page'>
				<header className='rb-home-nav'>
					<RabtWordmark />
					<nav className='rb-home-nav-links'>
						<Link to='/login' className='rb-link-btn'>Sign in</Link>
						<Link to='/register' className='rb-cta-btn'>Get started</Link>
					</nav>
				</header>

				<section className='rb-hero'>
					<div className='rb-hero-copy'>
						<span className='rb-kicker-badge'>
							<span className='rb-live-dot' />
							Real-time messaging
						</span>
						<h1 className='rb-headline'>
							Messages that land <span className='rb-headline-mark'>while you're still typing</span> a reply.
						</h1>
						<p className='rb-lede'>
							Rabt is Urdu for &ldquo;connection.&rdquo; It's a no-frills chat app built on WebSockets
							— instant delivery, live typing indicators, and a theme that follows you across
							devices. No feeds. No ads. Just the conversation.
						</p>
						<div className='rb-hero-actions'>
							<Link to='/register' className='rb-cta-btn large'>Create free account</Link>
							<Link to='/login' className='rb-text-link'>Sign in</Link>
						</div>
						<p className='rb-proof-row'>OPEN SOURCE · SELF-HOSTED · NO ADS</p>
					</div>

					<div className='rb-hero-visual'>
						<div className='rb-hero-visual-bg' />
						<div className='rb-window'>
							<div className='rb-window-bar'>
								<span className='rb-window-dot' />
								<span className='rb-window-dot' />
								<span className='rb-window-dot' />
								<span className='rb-window-url'>rabt.app/chat</span>
							</div>
							<div className='rb-window-body'>
								<div className='rb-mini-sidebar'>
									<div className='rb-mini-contact active'>
										<span className='rb-mini-avatar'>MI</span>
										<div>
											<div className='rb-mini-name'>Mara Ito</div>
											<div className='rb-mini-preview'>see you at 10</div>
										</div>
									</div>
									<div className='rb-mini-contact'>
										<span className='rb-mini-avatar'>TR</span>
										<div>
											<div className='rb-mini-name'>Theo Reyes</div>
											<div className='rb-mini-preview'>sounds good!</div>
										</div>
									</div>
									<div className='rb-mini-contact'>
										<span className='rb-mini-avatar'>JL</span>
										<div>
											<div className='rb-mini-name'>Jordan Lee</div>
											<div className='rb-mini-preview'>typing…</div>
										</div>
									</div>
								</div>
								<div className='rb-mini-thread'>
									<div className='rb-mini-bubble recv'>hey! are we still on for saturday?</div>
									<div className='rb-mini-bubble sent'>yes! I'll bring the good coffee this time</div>
									<div className='rb-mini-bubble recv'>perfect, I'll bring pastries</div>
									<div className='rb-mini-typing'><span /><span /><span /></div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className='rb-features'>
					<div className='rb-feature'>
						<div className='rb-feature-num'>01</div>
						<h3>Delivered instantly</h3>
						<p>Messages arrive the moment you hit send — no refresh, no delay.</p>
					</div>
					<div className='rb-feature'>
						<div className='rb-feature-num'>02</div>
						<h3>Picks up where you left off</h3>
						<p>Your conversations and theme preference sync the moment you sign in on a new device.</p>
					</div>
					<div className='rb-feature'>
						<div className='rb-feature-num'>03</div>
						<h3>Typing, live</h3>
						<p>See exactly when someone's writing back, in real time.</p>
					</div>
				</section>

				<footer className='rb-site-footer'>
					<RabtWordmark />
					<p>© 2026 RABT — BUILT WITH DJANGO, CHANNELS &amp; REACT</p>
				</footer>
			</div>
		</>
	);
};

export default HomePage;
