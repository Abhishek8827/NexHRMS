import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@firebase/auth';
import api from '../../services/api';
import { firebaseAuth } from '../../services/firebase';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    if (!firebaseAuth) {
      return rejectWithValue('Firebase Authentication is not configured.');
    }

    try {
      await signInWithEmailAndPassword(
        firebaseAuth,
        credentials.email.trim(),
        credentials.password,
      );
      return null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to sign in. Check your email and password.',
      );
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  if (firebaseAuth?.currentUser) {
    await signOut(firebaseAuth);
  }
});

export const getCurrentUser = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      if ([401, 403].includes(error.response?.status) && firebaseAuth?.currentUser) {
        await signOut(firebaseAuth).catch(() => {});
      }

      return rejectWithValue(
        error.response?.data?.message || 'Unable to load your account.',
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profile, { rejectWithValue }) => {
    try {
      const response = await api.put('/employees/me', profile);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to update your profile.',
      );
    }
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    const firebaseUser = firebaseAuth?.currentUser;
    if (!firebaseUser?.email) {
      return rejectWithValue('You must be signed in to change your password.');
    }

    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      return true;
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        return rejectWithValue('Your current password is incorrect.');
      }
      return rejectWithValue(error.message || 'Unable to change your password.');
    }
  },
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  initialLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: () => ({ ...initialState, initialLoading: false }),
    authReady: (state) => {
      state.initialLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(logoutUser.fulfilled, () => ({
        ...initialState,
        initialLoading: false,
      }))
      .addCase(getCurrentUser.pending, (state) => {
        state.initialLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialLoading = false;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { authReady, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
