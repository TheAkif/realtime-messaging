import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Layout from 'components/Layout';

const ChatPage = () => {
	const { isAuthenticated, user, loading } = useSelector(state => state.user);

	if (!isAuthenticated && !loading && user === null)
		return <Navigate to='/login' />;

	return (
		<Layout title='Realtime messaging | chat' content='chat page'>
			{loading || user === null ? (
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			) : (
				<>
					<h1 className='mb-5'>chat</h1>
					<p>User Details</p>
					<ul>
						<li>First Name: {user.first_name}</li>
						<li>Last Name: {user.last_name}</li>
						<li>Email: {user.email}</li>
					</ul>
				</>
			)}
		</Layout>
	);
};

export default ChatPage;
