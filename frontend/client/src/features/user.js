import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getInitialTheme } from 'utils/theme';

const firstFieldError = payload => {
	if (!payload) return 'An error occurred';
	if (payload.non_field_errors) return payload.non_field_errors[0];
	const [firstValue] = Object.values(payload);
	return Array.isArray(firstValue) ? firstValue[0] : firstValue || 'An error occurred';
};

export const register = createAsyncThunk(
	'users/register',
	async ({ first_name, last_name, email, password }, thunkAPI) => {
		const body = JSON.stringify({
			first_name,
			last_name,
			email,
			password,
		});

		try {
			const res = await fetch('/api/users/register', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body,
			});

			const data = await res.json();

			if (res.status === 201) {
				return data;
			} else {
				return thunkAPI.rejectWithValue(data);
			}
		} catch (err) {
			return thunkAPI.rejectWithValue(err.response.data);
		}
	}
);

const getUser = createAsyncThunk('users/me', async (_, thunkAPI) => {
	try {
		const res = await fetch('/api/users/me', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		const data = await res.json();

		if (res.status === 200) {
			return data;
		} else {
			return thunkAPI.rejectWithValue(data);
		}
	} catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	}
});

export const getAllUsers = createAsyncThunk('users/all', async (_, thunkAPI) => {
	try {
		const res = await fetch('/api/users/all', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		const data = await res.json();

		if (res.status === 200) {
			return data;
		} else {
			return thunkAPI.rejectWithValue(data);
		}
	} catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	}
});

export const getConversations = createAsyncThunk('users/conversations', async (_, thunkAPI) => {
	try {
		const res = await fetch('/api/users/conversations', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		const data = await res.json();

		if (res.status === 200) {
			return data;
		} else {
			return thunkAPI.rejectWithValue(data);
		}
	} catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	}
});


export const getChatHistory = createAsyncThunk(
	'chat/getChatHistory',
	async (targetUserId, thunkAPI) => {

		try {
			const response = await fetch(`/api/users/messages/${targetUserId}`, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			});
			const data = await response.json();
			if (response.status === 200) {
				return data;
			} else {
				return thunkAPI.rejectWithValue(data);
			}
		} catch (err) {
			return thunkAPI.rejectWithValue(err.response.data);
		}
	}
);

export const login = createAsyncThunk(
	'users/login',
	async ({ email, password }, thunkAPI) => {
		const body = JSON.stringify({
			email,
			password,
		});

		try {
			const res = await fetch('/api/users/login', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body,
			});

			const data = await res.json();

			if (res.status === 200) {
				const { dispatch } = thunkAPI;

				dispatch(getUser());

				return data;
			} else {
				return thunkAPI.rejectWithValue(data);
			}
		} catch (err) {
			return thunkAPI.rejectWithValue(err.response.data);
		}
	}
);

export const checkAuth = createAsyncThunk(
	'users/verify',
	async (_, thunkAPI) => {
		try {
			const res = await fetch('/api/users/verify', {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			});

			const data = await res.json();

			if (res.status === 200) {
				const { dispatch } = thunkAPI;

				dispatch(getUser());

				return data;
			} else {
				return thunkAPI.rejectWithValue(data);
			}
		} catch (err) {
			return thunkAPI.rejectWithValue(err.response.data);
		}
	}
);

export const getWsTicket = async () => {
	const res = await fetch('/api/users/ws-ticket', {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
	});

	if (res.status !== 200) {
		throw new Error('Could not start a chat session');
	}

	const data = await res.json();
	return data.ticket;
};

// Persists the theme choice to the signed-in user's account so it follows
// them across devices. Best-effort: if this fails, the choice still applies
// locally (via the themeChanged reducer below) and to localStorage, it just
// won't have synced anywhere else yet.
export const syncThemePreference = createAsyncThunk(
	'users/syncTheme',
	async (theme, thunkAPI) => {
		const { user } = thunkAPI.getState();
		if (!user.isAuthenticated) return;

		try {
			await fetch('/api/users/theme', {
				method: 'PATCH',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ theme }),
			});
		} catch (err) {
			console.error('Could not save theme preference:', err);
		}
	}
);

export const logout = createAsyncThunk('users/logout', async (_, thunkAPI) => {
	try {
		const res = await fetch('/api/users/logout', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		const data = await res.json();

		if (res.status === 200) {
			return data;
		} else {
			return thunkAPI.rejectWithValue(data);
		}
	} catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	}
});

const initialState = {
	isAuthenticated: false,
	user: null,
	loading: false,
	historyLoading: false,
	registered: false,
	users: [],
	conversations: [],
	chatHistory: null,
	error: null,
	theme: getInitialTheme(),
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		resetRegistered: state => {
			state.registered = false;
		},
		setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: state => {
            state.error = null;
        },
        receiveLiveMessage: (state, action) => {
            const { message, contactId } = action.payload;
            if (!state.chatHistory) state.chatHistory = [];
            state.chatHistory.push(message);

            const conversation = state.conversations.find(c => c.id === contactId);
            if (conversation) {
                conversation.last_message = {
                    content: message.content,
                    timestamp: message.timestamp,
                    sender: message.sender,
                };
                state.conversations = [
                    conversation,
                    ...state.conversations.filter(c => c.id !== contactId),
                ];
            }
        },
        markConversationRead: (state, action) => {
            const conversation = state.conversations.find(c => c.id === action.payload);
            if (conversation) conversation.unread_count = 0;
        },
        themeChanged: (state, action) => {
            state.theme = action.payload;
        },
	},
	extraReducers: builder => {
		builder
			.addCase(register.pending, state => {
				state.loading = true;
				state.error = null;
			})
			.addCase(register.fulfilled, state => {
				state.loading = false;
				state.registered = true;
                state.error =null;
			})
			.addCase(register.rejected, (state, action) => {
				state.loading = false;
                state.error = firstFieldError(action.payload);
			})
			.addCase(login.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(login.fulfilled, state => {
				state.loading = false;
				state.isAuthenticated = true;
                state.error = null;
			})
			.addCase(login.rejected, (state, action) => {
				state.loading = false;
                state.error = action.payload.detail || "An error occurred";
			})
			.addCase(getUser.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(getUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
                state.error = null;
                if (action.payload.theme_preference) {
                    state.theme = action.payload.theme_preference;
                }
			})
			.addCase(getUser.rejected, (state, action) => {
				state.loading = false;
                state.error = action.payload.detail || "An error occurred";
			})
			.addCase(checkAuth.pending, state => {
				state.loading = true;
			})
			.addCase(checkAuth.fulfilled, state => {
				state.loading = false;
				state.isAuthenticated = true;
			})
			.addCase(checkAuth.rejected, state => {
				state.loading = false;
			})
			.addCase(logout.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(logout.fulfilled, state => {
				state.loading = false;
				state.isAuthenticated = false;
				state.user = null;
                state.error = null;
			})
			.addCase(logout.rejected, (state, action) => {
				state.loading = false;
                state.error = action.payload.detail || "An error occurred";
			})
			.addCase(getAllUsers.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(getAllUsers.fulfilled, (state, action) => {
				state.loading = false;
				state.users = action.payload;
                state.error = null;
			})
			.addCase(getAllUsers.rejected, (state, action) => {
				state.loading = false;
                state.error = action.payload.detail || "An error occurred";
			})
			.addCase(getConversations.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(getConversations.fulfilled, (state, action) => {
				state.loading = false;
				state.conversations = action.payload;
                state.error = null;
			})
			.addCase(getConversations.rejected, (state, action) => {
				state.loading = false;
                state.error = action.payload.detail || "An error occurred";
			})
			.addCase(getChatHistory.pending, state => {
				state.historyLoading = true;
                state.error = null;
			})
			.addCase(getChatHistory.fulfilled, (state, action) => {
				state.historyLoading = false;
				state.chatHistory = action.payload;
                state.error = null;
			})
			.addCase(getChatHistory.rejected, (state, action) => {
				state.historyLoading = false;
                state.error = action.payload.detail || "An error occurred";
			});
	},
});

export const { resetRegistered, receiveLiveMessage, markConversationRead, themeChanged } =
	userSlice.actions;
export default userSlice.reducer;
