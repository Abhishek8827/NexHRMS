import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyPayroll = createAsyncThunk(
  'payroll/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/payroll/my');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchAllPayroll = createAsyncThunk(
  'payroll/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/payroll', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const processPayroll = createAsyncThunk(
  'payroll/process',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/payroll/process', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const markAsPaid = createAsyncThunk(
  'payroll/markPaid',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/payroll/${id}/pay`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchCTCBreakdown = createAsyncThunk(
  'payroll/ctc',
  async (employeeId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/payroll/ctc/${employeeId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    myPayslips: [],
    allRecords: [],
    ctcData: null,
    loading: false,
    processing: false,
    error: null,
  },
  reducers: {
    clearCTC: (state) => { state.ctcData = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPayroll.pending, (state) => { state.loading = true; })
      .addCase(fetchMyPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.myPayslips = action.payload;
      })
      .addCase(fetchMyPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllPayroll.pending, (state) => { state.loading = true; })
      .addCase(fetchAllPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.allRecords = action.payload;
      })
      .addCase(fetchAllPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(processPayroll.pending, (state) => { state.processing = true; })
      .addCase(processPayroll.fulfilled, (state, action) => {
        state.processing = false;
        const idx = state.allRecords.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.allRecords[idx] = action.payload;
        else state.allRecords.unshift(action.payload);
      })
      .addCase(processPayroll.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      })
      .addCase(markAsPaid.fulfilled, (state, action) => {
        const idx = state.allRecords.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.allRecords[idx] = action.payload;
      })
      .addCase(fetchCTCBreakdown.fulfilled, (state, action) => {
        state.ctcData = action.payload;
      });
  },
});

export const { clearCTC } = payrollSlice.actions;
export default payrollSlice.reducer;