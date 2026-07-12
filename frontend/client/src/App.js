import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { checkAuth } from 'features/user';

import HomePage from 'containers/HomePage';
import ChatPage from 'containers/ChatPage';
import LoginPage from 'containers/LoginPage';
import RegisterPage from 'containers/RegisterPage';

const App = () => {
	const dispatch = useDispatch();
	const theme = useSelector(state => state.user.theme);

	useEffect(() => {
		dispatch(checkAuth());
	}, []);

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('rt-theme', theme);
	}, [theme]);

	return (
		<Router>
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/chat' element={<ChatPage />} />
				<Route path='/login' element={<LoginPage />} />
				<Route path='/register' element={<RegisterPage />} />
			</Routes>
		</Router>
	);
};

export default App;
