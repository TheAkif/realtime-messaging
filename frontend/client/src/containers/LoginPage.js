import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { resetRegistered, login } from 'features/user';
import Layout from 'components/Layout';

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
		<Layout title='Realtime messaging | Login' content='Login page'>
			<div className='d-flex justify-content-center align-items-center' style={{ height: '80vh' }}>
				<div className='w-100' style={{ maxWidth: '400px' }}>
					<h1 className='text-center mb-4'>Log into your Account</h1>
					<form onSubmit={onSubmit} className='mb-5'>
						<div className='form-group mb-3'>
							<label htmlFor='email'>Email</label>
							<input
								className='form-control'
								type='email'
								name='email'
								onChange={onChange}
								value={email}
								required
							/>
						</div>
						<div className='form-group mb-3'>
							<label htmlFor='password'>Password</label>
							<input
								className='form-control'
								type='password'
								name='password'
								onChange={onChange}
								value={password}
								required
							/>
						</div>
						{loading ? (
							<div className='d-flex justify-content-center'>
								<div className='spinner-border text-primary' role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
							</div>
						) : (
							<button className='btn btn-primary w-100'>Login</button>
						)}
					</form>
					{error && <div className="alert alert-danger">{error}</div>}
				</div>
			</div>
		</Layout>
	);
};

export default LoginPage;
