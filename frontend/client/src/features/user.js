import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

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
	registered: false,
	users: [],
	chatHistory: null,
	error: null,
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
                state.error = action.payload.non_field_errors || "An error occurred";
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
			.addCase(getChatHistory.pending, state => {
				state.loading = true;
                state.error = null;
			})
			.addCase(getChatHistory.fulfilled, (state, action) => {
				state.loading = false;
				state.chatHistory = action.payload;
                state.error = null;
			})
			.addCase(getChatHistory.rejected, (state, action) => {
				state.loading = false;
                state.error = action.payload.detail || "An error occurred";
			});
	},
});

export const { resetRegistered } = userSlice.actions;
export default userSlice.reducer;
