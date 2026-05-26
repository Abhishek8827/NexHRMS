// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import api from '../../services/api';

// export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
//   try {
//     const res = await api.post('/auth/login', credentials);
//     return res.data.data;
//   } catch (err) {
//     return rejectWithValue(err.response?.data?.message || 'Login failed');
//   }
// });

// export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
//   try {
//     await api.post('/auth/logout');
//   } catch (err) {
//     return rejectWithValue(err.response?.data?.message);
//   }
// });

// export const getCurrentUser = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
//   try {
//     const res = await api.get('/auth/me');
//     return res.data.data;
//   } catch (err) {
//     return rejectWithValue(err.response?.data?.message);
//   }
// });

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     accessToken: null,
//     isAuthenticated: false,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     setAccessToken: (state, action) => {
//       state.accessToken = action.payload;
//     },
//     logout: (state) => {
//       state.user = null;
//       state.accessToken = null;
//       state.isAuthenticated = false;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.isAuthenticated = true;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(logoutUser.fulfilled, (state) => {
//         state.user = null;
//         state.accessToken = null;
//         state.isAuthenticated = false;
//       })
//       .addCase(getCurrentUser.fulfilled, (state, action) => {
//         state.user = action.payload;
//         state.isAuthenticated = true;
//       })
//       .addCase(getCurrentUser.rejected, (state) => {
//         state.user = null;
//         state.accessToken = null;
//         state.isAuthenticated = false;
//       });
//   },
// });

// export const { setAccessToken, logout, clearError } = authSlice.actions;
// export default authSlice.reducer;


// new
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const { user, accessToken } = res.data.data;
      localStorage.setItem('nexhr_token', accessToken);
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('nexhr_token');
    } catch (err) {
      localStorage.removeItem('nexhr_token');
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data.data;
    } catch (err) {
      localStorage.removeItem('nexhr_token');
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('nexhr_token') || null,
    isAuthenticated: false,
    loading: false,
    initialLoading: true,
    error: null,
  },
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      localStorage.setItem('nexhr_token', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('nexhr_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialLoading = false;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.initialLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialLoading = false;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialLoading = false;
      });
  },
});

export const { setAccessToken, logout, clearError } = authSlice.actions;
export default authSlice.reducer;