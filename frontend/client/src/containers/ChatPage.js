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
		<Layout title='Realtime messaging | chat' content='chat page'>
			{loading ? (
				<div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
					<div className='spinner-border text-primary' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			) : (
				<div className='container'>
					<div className='row' style={{ height: '80vh' }}>
						{/* User List Sidebar */}
						<div className='col-4 border-end'>
							<div className='list-group'>
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
						<div className='col-8'>
							{activeChatUser ? (
								<>
									<div className='chat-messages overflow-auto mb-3' style={{ maxHeight: '70%' }}>
										{chatHistory.map((message, index) => (
											<div key={index} className={`m-2 d-flex ${message.sender === user.id ? 'justify-content-end' : 'justify-content-start'}`}>
												<div className={`badge ${message.sender === user.id ? 'bg-primary' : 'bg-secondary'} pl-2 pr-2 pb-3 pt-3`}>
													{message.content}
												</div>
											</div>
										))}
									</div>
									<div className='chat-input'>
										<input className='form-control' type='text' placeholder='Type a message...' />
										<button className='btn btn-primary mt-2'>Send</button>
									</div>
								</>
							) : (
								<p className='text-center align-middle my-auto'>Select a user to start chatting</p>
							)}
						</div>
					</div>
				</div>
			)}
		</Layout>
	);
};

export default ChatPage;
