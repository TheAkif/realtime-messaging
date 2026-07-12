import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { register } from 'features/user';
import RabtWordmark from 'components/RabtWordmark';
import 'styles/rb-tokens.css';
import 'styles/auth.css';

const RegisterPage = () => {
	const dispatch = useDispatch();
	const { registered, loading, error } = useSelector(state => state.user);

	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		email: '',
		password: '',
	});

	const { first_name, last_name, email, password } = formData;

	const onChange = e => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const onSubmit = e => {
		e.preventDefault();

		dispatch(register({ first_name, last_name, email, password }));
	};

	if (registered) return <Navigate to='/login' />;

	return (
		<>
			<Helmet>
				<title>Rabt | Register</title>
				<meta name='description' content='Register page' />
			</Helmet>
			<div className='rb-auth-page'>
				<div className='rb-auth-split'>
					<div className='rb-auth-form-panel'>
						<div className='rb-auth-form-inner'>
							<RabtWordmark />
							<h1 className='rb-auth-heading'>Create your account</h1>
							<p className='rb-auth-subtext'>Takes about a minute.</p>

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
									<div className='rb-field-name-row'>
										<label className='rb-auth-field' htmlFor='register-first-name'>
											<span className='rb-auth-label'>First name</span>
											<input
												id='register-first-name'
												className='rb-auth-input'
												type='text'
												name='first_name'
												autoComplete='given-name'
												placeholder='Mara'
												onChange={onChange}
												value={first_name}
												disabled={loading}
												required
											/>
										</label>
										<label className='rb-auth-field' htmlFor='register-last-name'>
											<span className='rb-auth-label'>Last name</span>
											<input
												id='register-last-name'
												className='rb-auth-input'
												type='text'
												name='last_name'
												autoComplete='family-name'
												placeholder='Ito'
												onChange={onChange}
												value={last_name}
												disabled={loading}
												required
											/>
										</label>
									</div>
									<label className='rb-auth-field' htmlFor='register-email'>
										<span className='rb-auth-label'>Email</span>
										<input
											id='register-email'
											className='rb-auth-input'
											type='email'
											name='email'
											autoComplete='email'
											placeholder='you@example.com'
											onChange={onChange}
											value={email}
											disabled={loading}
											required
										/>
									</label>
									<label className='rb-auth-field' htmlFor='register-password'>
										<span className='rb-auth-label'>Password</span>
										<input
											id='register-password'
											className='rb-auth-input'
											type='password'
											name='password'
											autoComplete='new-password'
											onChange={onChange}
											value={password}
											disabled={loading}
											required
										/>
										<span className='rb-field-hint'>At least 8 characters, not all numeric</span>
									</label>
								</div>

								{error && (
									<p className='rb-auth-error' role='alert' style={{ marginTop: 16 }}>
										{error}
									</p>
								)}

								<button type='submit' className='rb-auth-submit' disabled={loading} style={{ marginTop: 16 }}>
									{loading ? 'Creating account…' : 'Create account'}
								</button>
							</form>

							<p className='rb-auth-footer'>
								Already have an account? <Link to='/login' className='rb-auth-footer-link'>Sign in</Link>
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

export default RegisterPage;
