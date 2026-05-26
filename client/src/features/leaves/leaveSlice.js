import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyLeaves = createAsyncThunk(
  'leaves/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/leaves/my');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchLeaveBalance = createAsyncThunk(
  'leaves/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/leaves/balance');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const applyLeave = createAsyncThunk(
  'leaves/apply',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/leaves/apply', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchPendingLeaves = createAsyncThunk(
  'leaves/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/leaves/pending');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'leaves/updateStatus',
  async ({ id, action, reason }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/leaves/${id}/${action}`, { reason });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState: {
    myLeaves: [],
    pending: [],
    balance: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeaves.pending, (state) => { state.loading = true; })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.myLeaves.unshift(action.payload);
      })
      .addCase(fetchPendingLeaves.fulfilled, (state, action) => {
        state.pending = action.payload;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.pending = state.pending.filter(
          l => l._id !== action.payload._id
        );
      });
  },
});

export default leaveSlice.reducer;