import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── Thunks ─────────────────────────────────────────────────

export const fetchComplaints = createAsyncThunk(
  "complaints/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/complaints");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch");
    }
  }
);

export const createComplaint = createAsyncThunk(
  "complaints/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/complaints", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit");
    }
  }
);

export const updateComplaintStatus = createAsyncThunk(
  "complaints/updateStatus",
  async ({ id, status, resolution }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/complaints/${id}/status`, {
        status,
        resolution,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update");
    }
  }
);

export const deleteComplaint = createAsyncThunk(
  "complaints/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/complaints/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete");
    }
  }
);

// ── Slice ──────────────────────────────────────────────────
const complaintSlice = createSlice({
  name: "complaints",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = Array.isArray(payload) ? payload : payload?.complaints || [];
      })
      .addCase(fetchComplaints.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // Create — add to top
      .addCase(createComplaint.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
      })

      // Update status — replace in list
      .addCase(updateComplaintStatus.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((c) => c._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })

      // Delete — remove from list
      .addCase(deleteComplaint.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((c) => c._id !== payload);
      });
  },
});

export const { clearError } = complaintSlice.actions;
export default complaintSlice.reducer;