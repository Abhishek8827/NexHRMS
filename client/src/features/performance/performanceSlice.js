import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyReviews = createAsyncThunk(
  'performance/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/performance/my');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchAllReviews = createAsyncThunk(
  'performance/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/performance', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createReview = createAsyncThunk(
  'performance/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/performance', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateReview = createAsyncThunk(
  'performance/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/performance/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const submitSelfReview = createAsyncThunk(
  'performance/selfReview',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/performance/${id}/self-review`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const submitManagerReview = createAsyncThunk(
  'performance/managerReview',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/performance/${id}/manager-review`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const performanceSlice = createSlice({
  name: 'performance',
  initialState: {
    myReviews: [],
    allReviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyReviews.pending, (state) => { state.loading = true; })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.myReviews = action.payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllReviews.pending, (state) => { state.loading = true; })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.allReviews = action.payload;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.allReviews.unshift(action.payload);
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const idx = state.allReviews.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.allReviews[idx] = action.payload;
        const myIdx = state.myReviews.findIndex(r => r._id === action.payload._id);
        if (myIdx !== -1) state.myReviews[myIdx] = action.payload;
      })
      .addCase(submitSelfReview.fulfilled, (state, action) => {
        const idx = state.myReviews.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.myReviews[idx] = action.payload;
      })
      .addCase(submitManagerReview.fulfilled, (state, action) => {
        const idx = state.allReviews.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.allReviews[idx] = action.payload;
      });
  },
});

export default performanceSlice.reducer;