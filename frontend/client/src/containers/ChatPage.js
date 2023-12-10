import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Layout from 'components/Layout';
import { getAllUsers, getChatHistory } from 'features/user'

const ChatPage = () => {
	const dispatch = useDispatch();
	const { isAuthenticated, user, loading, users, chatHistory } = useSelector(state => ({
		...state.user,
		users: state.user.users,
		chatHistory: state.user.chatHistory,
	}));
	const [activeChatUser, setActiveChatUser] = useState(null);

	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState([]);
	const ws = useRef(null);


	useEffect(() => {
		return () => {
			if (ws.current) {
				ws.current.close();
			}
		};
	}, []);

	const handleSendMessage = () => {
		const payload = {
			user_id: user.chat_uuid,
			message: message
		};
		if (ws.current && message) {
			ws.current.send(JSON.stringify(payload));
			setMessage('');
		}
	};

	useEffect(() => {
		dispatch(getAllUsers());
	}, [dispatch]);

	if (!isAuthenticated && !loading && user === null)
		return <Navigate to='/login' />;

	const handleUserClick = (chatUser) => {
		setActiveChatUser(chatUser);
		dispatch(getChatHistory(chatUser.id));

		if (ws.current) {
			ws.current.close();
		}

		// Initialize WebSocket connection
		console.log(activeChatUser.chat_uuid)
		ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${activeChatUser.chat_uuid}/`);
		ws.current.onopen = () => console.log('WebSocket connected');
		ws.current.onmessage = e => {
			const data = JSON.parse(e.data);
			setMessages(prev => [...prev, data.message]);
		};
		ws.current.onerror = error => console.error('WebSocket error:', error);
		ws.current.onclose = () => console.log('WebSocket disconnected');
	};

	return (
		<Layout title='Realtime messaging | Chat' content='Chat page'>
			{loading ? (
				<div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
					<div className='spinner-border text-primary' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			) : (
				<div className='container py-4'>
					<div className='row no-gutters' style={{ height: '80vh' }}>
						{/* User List Sidebar */}
						<div className='col-md-4 col-lg-3 bg-light border-right'>
							<div className='list-group list-group-flush'>
								{users.filter(chatUser => chatUser.id !== user.id) // Filter out the current user
									.map((chatUser) => (
										<button
											key={chatUser.id}
											type='button'
											className={`list-group-item list-group-item-action ${activeChatUser?.id === chatUser.id ? 'active' : ''}`}
											onClick={() => handleUserClick(chatUser)}
										>
											{chatUser.first_name} {chatUser.last_name}
										</button>
									))}
							</div>
						</div>
						{/* Chat Area */}
						<div className='col-md-8 col-lg-9'>
							<div className='chat-header p-3 border-bottom'>
								<strong>{activeChatUser ? `${activeChatUser.first_name} ${activeChatUser.last_name}` : 'Chat'}</strong>
							</div>
							<div className='chat-messages p-3 overflow-auto' style={{ maxHeight: '70%' }}>
								{activeChatUser ? (
									chatHistory.length > 0 ? (
										chatHistory.map((message, index) => (
											<div key={index} className={`message mb-3 d-flex flex-column ${message.sender === user.id ? 'align-items-end' : 'align-items-start'}`}>
												<div className={`d-inline-block p-2 rounded ${message.sender === user.id ? 'bg-primary text-white' : 'bg-light'}`}>
													{message.content}
												</div>
												<div className='text-muted small mt-1' style={{ fontSize: '0.75rem' }}>
													{new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</div>
											</div>
										))
									) : (
										<div className='text-center text-muted'>
											<p>No messages yet. Start the conversation!</p>
										</div>
									)
								) : (
									<p className='text-center my-auto'>Select a user to start chatting</p>
								)}
							</div>
							{activeChatUser && (
								<div className='chat-input p-3 border-top'>
									<input
										className='form-control'
										type='text'
										placeholder='Type a message...'
										value={message}
										onChange={e => setMessage(e.target.value)}
									/>
									<button
										className='btn btn-primary mt-2 float-right'
										onClick={handleSendMessage}
									>
										Send
									</button>
								</div>
							)}
						</div>

					</div>
				</div>
			)}
		</Layout>
	);

};

export default ChatPage;
