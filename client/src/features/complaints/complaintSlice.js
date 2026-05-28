import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchComplaints = createAsyncThunk(
  'complaints/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/complaints');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch');
    }
  }
);

export const createComplaint = createAsyncThunk(
  'complaints/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/complaints', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create');
    }
  }
);

export const updateComplaintStatus = createAsyncThunk(
  'complaints/updateStatus',
  async ({ id, status, resolution }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/complaints/${id}/status`, {
        status, resolution,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update');
    }
  }
);

const complaintSlice = createSlice({
  name: 'complaints',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearComplaints: (state) => { state.list = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export const { clearComplaints } = complaintSlice.actions;
export default complaintSlice.reducer;