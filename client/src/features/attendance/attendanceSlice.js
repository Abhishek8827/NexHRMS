import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTodayAttendance = createAsyncThunk(
  'attendance/today',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/attendance/today');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const punchIn = createAsyncThunk(
  'attendance/punchIn',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/attendance/punch-in', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const punchOut = createAsyncThunk(
  'attendance/punchOut',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/attendance/punch-out');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchMyAttendance = createAsyncThunk(
  'attendance/fetchMy',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/attendance/my', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    today: null,
    records: [],
    summary: {},
    loading: false,    // for fetchMyAttendance (table loading)
    punchLoading: false, // ADDED: separate loading for punch actions
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Today status
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.today = action.payload;
      })

      // Punch In — FIXED: track loading separately
      .addCase(punchIn.pending, (state) => {
        state.punchLoading = true;
      })
      .addCase(punchIn.fulfilled, (state, action) => {
        state.punchLoading = false;
        state.today = action.payload;
      })
      .addCase(punchIn.rejected, (state) => {
        state.punchLoading = false;
      })

      // Punch Out — FIXED: track loading separately
      .addCase(punchOut.pending, (state) => {
        state.punchLoading = true;
      })
      .addCase(punchOut.fulfilled, (state, action) => {
        state.punchLoading = false;
        state.today = action.payload;
      })
      .addCase(punchOut.rejected, (state) => {
        state.punchLoading = false;
      })

      // My attendance records
      .addCase(fetchMyAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.summary = action.payload.summary;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default attendanceSlice.reducer;