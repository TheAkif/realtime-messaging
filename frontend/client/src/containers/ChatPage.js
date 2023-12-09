import { useEffect, useState } from 'react';
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
	// const [chatSocket, setChatSocket] = useState(null);

	useEffect(() => {
		dispatch(getAllUsers());
	}, [dispatch]); // This effect is only for fetching users

	// useEffect(() => {
	// 	if (user) {
	// 		const newSocket = new WebSocket(`ws://your-django-backend-url/ws/chat/${user.chat_uuid}/`);
	// 		newSocket.onmessage = (e) => {
	// 			const data = JSON.parse(e.data);
	// 			if (data.message) {
	// 				setMessages(prevMessages => [...prevMessages, data.message]);
	// 			}
	// 		};
	// 		newSocket.onclose = (e) => {
	// 			console.error('Chat socket closed unexpectedly');
	// 		};
	// 		setChatSocket(newSocket);

	// 		return () => newSocket.close();
	// 	}
	// }, [user]);


	if (!isAuthenticated && !loading && user === null)
		return <Navigate to='/login' />;

	const handleUserClick = (chatUser) => {
		setActiveChatUser(chatUser);
		console.log(chatUser)
		dispatch(getChatHistory(chatUser.id)); // Dispatch action to get chat history
	};

	// const handleSendMessage = (messageText) => {
	// 	if (!chatSocket || !messageText.trim()) return;

	// 	const message = {
	// 		senderId: user.id,
	// 		receiverId: activeChatUser.id,
	// 		message: messageText,
	// 		timestamp: new Date()
	// 	};

	// 	chatSocket.send(JSON.stringify({ message: message }));
	// 	setMessages(messages => [...messages, message]);
	// 	// Clear the input field if necessary
	// };

	// ... (rest of your imports and component setup)

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
								{users.map((chatUser) => (
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
									<input className='form-control' type='text' placeholder='Type a message...' />
									<button className='btn btn-primary mt-2 float-right'>Send</button>
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
