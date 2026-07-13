import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { resetRegistered, login, clearError } from 'features/user';
import RabtWordmark from 'components/RabtWordmark';
import 'styles/rb-tokens.css';
import 'styles/auth.css';

const LoginPage = () => {
	const dispatch = useDispatch();
	const { loading, isAuthenticated, registered, error } = useSelector(
		state => state.user
	);

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	useEffect(() => {
		if (registered) dispatch(resetRegistered());
	}, [registered]);

	// A stray 401 from something unrelated (a background token refresh, a
	// stale getUser call) can leave state.error set from before this page
	// ever mounted - clear it so a fresh visit never shows a leftover
	// technical message the user didn't cause.
	useEffect(() => {
		dispatch(clearError());
	}, []);

	const { email, password } = formData;

	const onChange = e => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const onSubmit = e => {
		e.preventDefault();

		dispatch(login({ email, password }));
	};

	if (isAuthenticated) return <Navigate to='/chat' />;

	return (
		<>
			<Helmet>
				<title>Rabt | Login</title>
				<meta name='description' content='Login page' />
			</Helmet>
			<div className='rb-auth-page'>
				<div className='rb-auth-split'>
					<div className='rb-auth-form-panel'>
						<div className='rb-auth-form-inner'>
							<RabtWordmark />
							<h1 className='rb-auth-heading'>Welcome back</h1>
							<p className='rb-auth-subtext'>Sign in to pick up where you left off.</p>

							<button
								type='button'
								className='rb-google-btn'
								disabled
								title='Coming soon'
							>
								<svg width='16' height='16' viewBox='0 0 18 18' aria-hidden='true'>
									<path fill='#4285F4' d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z' />
									<path fill='#34A853' d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86a5.4 5.4 0 0 1-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z' />
									<path fill='#FBBC05' d='M3.95 10.7a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33z' />
									<path fill='#EA4335' d='M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.96l3 2.33A5.4 5.4 0 0 1 9 3.58z' />
								</svg>
								Continue with Google
							</button>

							<div className='rb-auth-divider'>
								<span className='rb-auth-divider-line' />
								<span className='rb-auth-divider-text'>OR</span>
								<span className='rb-auth-divider-line' />
							</div>

							<form onSubmit={onSubmit}>
								<div className='rb-auth-fields'>
									<label className='rb-auth-field' htmlFor='login-email'>
										<span className='rb-auth-label'>Email</span>
										<input
											id='login-email'
											className='rb-auth-input'
											type='email'
											name='email'
											autoComplete='email'
											onChange={onChange}
											value={email}
											disabled={loading}
											required
										/>
									</label>
									<label className='rb-auth-field' htmlFor='login-password'>
										<span className='rb-auth-field-row'>
											<span className='rb-auth-label'>Password</span>
											<button type='button' className='rb-auth-forgot-link' disabled title='Coming soon'>
												Forgot?
											</button>
										</span>
										<input
											id='login-password'
											className='rb-auth-input'
											type='password'
											name='password'
											autoComplete='current-password'
											onChange={onChange}
											value={password}
											disabled={loading}
											required
										/>
									</label>
								</div>

								{error && (
									<p className='rb-auth-error' role='alert' style={{ marginTop: 16 }}>
										{error}
									</p>
								)}

								<button type='submit' className='rb-auth-submit' disabled={loading} style={{ marginTop: 16 }}>
									{loading ? 'Signing in…' : 'Sign in'}
								</button>
							</form>

							<p className='rb-auth-footer'>
								New here? <Link to='/register' className='rb-auth-footer-link'>Create an account</Link>
							</p>
						</div>
					</div>

					<div className='rb-auth-brand-panel'>
						<div className='rb-brand-panel-inner'>
							<RabtWordmark onNavy />
							<div className='rb-brand-bubbles'>
								<div className='rb-mini-bubble recv'>hey! are we still on for saturday?</div>
								<div className='rb-mini-bubble sent'>yes! I'll bring the good coffee this time</div>
								<div className='rb-mini-bubble recv'>perfect, I'll bring pastries</div>
							</div>
							<ul className='rb-brand-feature-list'>
								<li>
									<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M20 6 9 17l-5-5' /></svg>
									Live typing indicators
								</li>
								<li>
									<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M20 6 9 17l-5-5' /></svg>
									Instant delivery, no refresh
								</li>
								<li>
									<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M20 6 9 17l-5-5' /></svg>
									Theme synced across devices
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default LoginPage;
