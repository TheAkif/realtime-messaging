import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { checkAuth, refreshAccessToken } from 'features/user';

import HomePage from 'containers/HomePage';
import ChatPage from 'containers/ChatPage';
import LoginPage from 'containers/LoginPage';
import RegisterPage from 'containers/RegisterPage';
import ProfilePage from 'containers/ProfilePage';

// Access tokens live for 30 minutes (backend SIMPLE_JWT setting); refreshing
// every 25 keeps a few minutes of buffer so an open tab never actually hits
// the expiry wall during an active session.
const TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000;

const App = () => {
	const dispatch = useDispatch();
	const { theme, isAuthenticated } = useSelector(state => state.user);

	useEffect(() => {
		dispatch(checkAuth());
	}, []);

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('rt-theme', theme);
	}, [theme]);

	useEffect(() => {
		if (!isAuthenticated) return;
		const interval = setInterval(() => {
			dispatch(refreshAccessToken());
		}, TOKEN_REFRESH_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [isAuthenticated, dispatch]);

	return (
		<Router>
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/chat' element={<ChatPage />} />
				<Route path='/profile' element={<ProfilePage />} />
				<Route path='/login' element={<LoginPage />} />
				<Route path='/register' element={<RegisterPage />} />
			</Routes>
		</Router>
	);
};

export default App;
