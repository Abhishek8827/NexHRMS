import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchJobs = createAsyncThunk(
  'recruitment/fetchJobs',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/jobs', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createJob = createAsyncThunk(
  'recruitment/createJob',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/jobs', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateJob = createAsyncThunk(
  'recruitment/updateJob',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/jobs/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchCandidates = createAsyncThunk(
  'recruitment/fetchCandidates',
  async (jobId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/jobs/${jobId}/candidates`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateCandidateStage = createAsyncThunk(
  'recruitment/updateStage',
  async ({ id, stage, notes }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/jobs/candidates/${id}/stage`, { stage, notes });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const recruitmentSlice = createSlice({
  name: 'recruitment',
  initialState: {
    jobs: [],
    candidates: [],
    selectedJob: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedJob: (state, action) => { state.selectedJob = action.payload; },
    clearCandidates: (state) => { state.candidates = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload);
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        const idx = state.jobs.findIndex(j => j._id === action.payload._id);
        if (idx !== -1) state.jobs[idx] = action.payload;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.candidates = action.payload;
      })
      .addCase(updateCandidateStage.fulfilled, (state, action) => {
        const idx = state.candidates.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.candidates[idx] = action.payload;
      });
  },
});

export const { setSelectedJob, clearCandidates } = recruitmentSlice.actions;
export default recruitmentSlice.reducer;