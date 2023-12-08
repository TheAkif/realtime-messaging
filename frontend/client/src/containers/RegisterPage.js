import { useState } from 'react';
import Layout from 'components/Layout';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { register } from 'features/user';

const RegisterPage = () => {
	const dispatch = useDispatch();
	const { registered, loading } = useSelector(state => state.user);

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
		<Layout title='Realtime messaging | Register' content='Register page'>
			<div className='d-flex justify-content-center align-items-center' style={{ height: '80vh' }}>
				<div className='w-100' style={{ maxWidth: '400px' }}>
					<h1 className='text-center mb-4'>Register for an Account</h1>
					<form onSubmit={onSubmit}>
						<div className='form-group mb-3'>
							<label htmlFor='first_name'>First Name</label>
							<input
								className='form-control'
								type='text'
								name='first_name'
								onChange={onChange}
								value={first_name}
								required
							/>
						</div>
						<div className='form-group mb-3'>
							<label htmlFor='last_name'>Last Name</label>
							<input
								className='form-control'
								type='text'
								name='last_name'
								onChange={onChange}
								value={last_name}
								required
							/>
						</div>
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
							<button className='btn btn-primary w-100 mt-3'>Register</button>
						)}
					</form>
				</div>
			</div>
		</Layout>
	);
	
};

export default RegisterPage;
