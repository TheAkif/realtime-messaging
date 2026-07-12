import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { register } from 'features/user';
import 'styles/tokens.css';
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
				<title>Realtime messaging | Register</title>
				<meta name='description' content='Register page' />
			</Helmet>
			<div className='rt-auth-page'>
				<div className='rt-auth-column'>
					<div className='rt-auth-brand'>
						<div className='rt-auth-wordmark'>
							<span>RealTime</span>
							<span className='rt-auth-wordmark-dot' />
						</div>
						<p className='rt-auth-greeting'>Messaging for people you actually talk to.</p>
					</div>

					<div className='rt-auth-card'>
						<button
							type='button'
							className='rt-auth-google-btn'
							disabled
							title='Coming soon'
						>
							<svg width='17' height='17' viewBox='0 0 18 18' aria-hidden='true'>
								<path fill='#4285F4' d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z' />
								<path fill='#34A853' d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86a5.4 5.4 0 0 1-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z' />
								<path fill='#FBBC05' d='M3.95 10.7a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33z' />
								<path fill='#EA4335' d='M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.96l3 2.33A5.4 5.4 0 0 1 9 3.58z' />
							</svg>
							Continue with Google
						</button>

						<div className='rt-auth-divider'>
							<span className='rt-auth-divider-line' />
							<span className='rt-auth-divider-text'>OR</span>
							<span className='rt-auth-divider-line' />
						</div>

						<div role='tablist' aria-label='Sign-up method' className='rt-auth-tablist'>
							<button type='button' role='tab' aria-selected='true' className='rt-auth-tab'>
								Email
							</button>
							<button
								type='button'
								role='tab'
								aria-selected='false'
								className='rt-auth-tab'
								disabled
								title='Coming soon'
							>
								Magic link
							</button>
							<button
								type='button'
								role='tab'
								aria-selected='false'
								className='rt-auth-tab'
								disabled
								title='Coming soon'
							>
								Phone
							</button>
						</div>

						<form onSubmit={onSubmit}>
							<div className='rt-auth-fields'>
								<label className='rt-auth-field' htmlFor='register-first-name'>
									<span className='rt-auth-label'>First name</span>
									<input
										id='register-first-name'
										className='rt-auth-input'
										type='text'
										name='first_name'
										autoComplete='given-name'
										placeholder='What your friends call you'
										onChange={onChange}
										value={first_name}
										disabled={loading}
										required
									/>
								</label>
								<label className='rt-auth-field' htmlFor='register-last-name'>
									<span className='rt-auth-label'>Last name</span>
									<input
										id='register-last-name'
										className='rt-auth-input'
										type='text'
										name='last_name'
										autoComplete='family-name'
										onChange={onChange}
										value={last_name}
										disabled={loading}
										required
									/>
								</label>
								<label className='rt-auth-field' htmlFor='register-email'>
									<span className='rt-auth-label'>Email</span>
									<input
										id='register-email'
										className='rt-auth-input'
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
								<label className='rt-auth-field' htmlFor='register-password'>
									<span className='rt-auth-label'>Password</span>
									<input
										id='register-password'
										className='rt-auth-input'
										type='password'
										name='password'
										autoComplete='new-password'
										onChange={onChange}
										value={password}
										disabled={loading}
										required
									/>
								</label>
							</div>

							{error && (
								<p className='rt-auth-error' role='alert' style={{ marginTop: 16 }}>
									{error}
								</p>
							)}

							<button type='submit' className='rt-auth-submit' disabled={loading} style={{ marginTop: 16 }}>
								{loading ? 'Creating account…' : 'Create account'}
							</button>
						</form>
					</div>

					<p className='rt-auth-footer'>
						Already have an account? <Link to='/login' className='rt-auth-footer-link'>Sign in</Link>
					</p>
				</div>
			</div>
		</>
	);
};

export default RegisterPage;
