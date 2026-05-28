import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyReimbursements = createAsyncThunk(
  'reimbursements/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/reimbursements/my');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const fetchAllReimbursements = createAsyncThunk(
  'reimbursements/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/reimbursements', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const createReimbursement = createAsyncThunk(
  'reimbursements/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/reimbursements', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const updateReimbursementStatus = createAsyncThunk(
  'reimbursements/updateStatus',
  async ({ id, status, approvedAmount, remarks }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/reimbursements/${id}/status`, {
        status, approvedAmount, remarks,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

const reimbursementSlice = createSlice({
  name: 'reimbursements',
  initialState: {
    myList: [],
    allList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyReimbursements.pending, (state) => { state.loading = true; })
      .addCase(fetchMyReimbursements.fulfilled, (state, action) => {
        state.loading = false;
        state.myList = action.payload;
      })
      .addCase(fetchMyReimbursements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllReimbursements.pending, (state) => { state.loading = true; })
      .addCase(fetchAllReimbursements.fulfilled, (state, action) => {
        state.loading = false;
        state.allList = action.payload;
      })
      .addCase(fetchAllReimbursements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReimbursement.fulfilled, (state, action) => {
        state.myList.unshift(action.payload);
      })
      .addCase(updateReimbursementStatus.fulfilled, (state, action) => {
        const myIdx = state.myList.findIndex(r => r._id === action.payload._id);
        if (myIdx !== -1) state.myList[myIdx] = action.payload;
        const allIdx = state.allList.findIndex(r => r._id === action.payload._id);
        if (allIdx !== -1) state.allList[allIdx] = action.payload;
      });
  },
});

export default reimbursementSlice.reducer;