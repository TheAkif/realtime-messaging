import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getInitialTheme } from 'utils/theme';

// Every backend/BFF error we produce takes one of a few shapes: DRF's
// {"detail": "..."} (auth/permission errors, SimpleJWT), DRF's field-keyed
// validation errors ({"email": ["..."]}) or {"non_field_errors": [...]},
// or the Express BFF's own {"error": "..."} for its own failures. Handles
// all of them, plus a missing/malformed payload, without ever throwing.
const extractErrorMessage = payload => {
	if (!payload || typeof payload !== 'object') return 'An error occurred';
	if (typeof payload.detail === 'string') return payload.detail;
	if (Array.isArray(payload.non_field_errors) && payload.non_field_errors.length) {
		return payload.non_field_errors[0];
	}
	if (typeof payload.error === 'string') return payload.error;
	const [firstValue] = Object.values(payload);
	if (Array.isArray(firstValue) && firstValue.length) return firstValue[0];
	if (typeof firstValue === 'string') return firstValue;
	return 'An error occurred';
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
			return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
		return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
		return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
		return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
			return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
			return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
		}
	}
);

// Mints a new access-token cookie from the longer-lived refresh cookie.
// Deliberately doesn't touch loading/error state - it's meant to run
// silently, either in the background on a timer or as a retry-once inside
// checkAuth, without flashing a page-wide spinner.
export const refreshAccessToken = createAsyncThunk(
	'users/refresh',
	async (_, thunkAPI) => {
		try {
			const res = await fetch('/api/users/refresh', {
				method: 'POST',
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
			return thunkAPI.rejectWithValue({ detail: 'Network error' });
		}
	}
);

export const checkAuth = createAsyncThunk(
	'users/verify',
	async (_, thunkAPI) => {
		try {
			const verify = () =>
				fetch('/api/users/verify', {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

			let res = await verify();

			// The access token cookie is short-lived (30 min). If it's expired
			// but the refresh cookie (24h) is still good, mint a new access
			// token and verify again before giving up - otherwise every
			// returning user with a stale access token gets bounced to
			// /login even though their session is still valid.
			if (res.status !== 200) {
				const refreshResult = await thunkAPI.dispatch(refreshAccessToken());
				if (refreshAccessToken.fulfilled.match(refreshResult)) {
					res = await verify();
				}
			}

			const data = await res.json();

			if (res.status === 200) {
				const { dispatch } = thunkAPI;

				dispatch(getUser());

				return data;
			} else {
				return thunkAPI.rejectWithValue(data);
			}
		} catch (err) {
			return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
		return thunkAPI.rejectWithValue({ detail: 'Network error. Please try again.' });
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
	presenceByContactId: {},
	typingByContactId: {},
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
            const { message, otherPartyId, isActiveConversation, viewerId } = action.payload;

            if (isActiveConversation) {
                if (!state.chatHistory) state.chatHistory = [];
                state.chatHistory.push(message);
            }

            const conversation = state.conversations.find(c => c.id === otherPartyId);
            if (conversation) {
                conversation.last_message = {
                    content: message.content,
                    timestamp: message.timestamp,
                    sender: message.sender,
                };
                // A message for a conversation I'm not currently looking at
                // is unread by definition - unless it's my own message
                // going out, echoed back to me.
                if (!isActiveConversation && message.sender !== viewerId) {
                    conversation.unread_count = (conversation.unread_count || 0) + 1;
                }
                state.conversations = [
                    conversation,
                    ...state.conversations.filter(c => c.id !== otherPartyId),
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
        presenceChanged: (state, action) => {
            const { userId, status } = action.payload;
            state.presenceByContactId[userId] = status;
        },
        typingStatusChanged: (state, action) => {
            const { userId, isTyping } = action.payload;
            if (isTyping) {
                state.typingByContactId[userId] = true;
            } else {
                delete state.typingByContactId[userId];
            }
        },
        messagesMarkedRead: (state, action) => {
            const { myUserId } = action.payload;
            if (!state.chatHistory) return;
            state.chatHistory.forEach(m => {
                if (m.sender === myUserId) m.read = true;
            });
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
                state.error = extractErrorMessage(action.payload);
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
                state.error = extractErrorMessage(action.payload);
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
                state.error = extractErrorMessage(action.payload);
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
                state.error = extractErrorMessage(action.payload);
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
                state.error = extractErrorMessage(action.payload);
			})
			.addCase(getConversations.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(getConversations.fulfilled, (state, action) => {
				state.loading = false;
				state.conversations = action.payload;
                state.error = null;
                // Bulk snapshot of who's online right now - live deltas
                // after this arrive over the WS presence broadcasts.
                action.payload.forEach(c => {
                    state.presenceByContactId[c.id] = c.online ? 'online' : 'offline';
                });
			})
			.addCase(getConversations.rejected, (state, action) => {
				state.loading = false;
                state.error = extractErrorMessage(action.payload);
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
                state.error = extractErrorMessage(action.payload);
			});
	},
});

export const {
	resetRegistered,
	receiveLiveMessage,
	markConversationRead,
	themeChanged,
	clearError,
	presenceChanged,
	messagesMarkedRead,
	typingStatusChanged,
} = userSlice.actions;
export default userSlice.reducer;
