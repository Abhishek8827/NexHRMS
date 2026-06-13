import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── Thunks ─────────────────────────────────────────────────

export const fetchReimbursements = createAsyncThunk(
  "reimbursements/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/reimbursements");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch");
    }
  }
);

export const submitReimbursement = createAsyncThunk(
  "reimbursements/submit",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/reimbursements", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit");
    }
  }
);

export const approveReimbursement = createAsyncThunk(
  "reimbursements/approve",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/reimbursements/${id}/approve`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve");
    }
  }
);

export const rejectReimbursement = createAsyncThunk(
  "reimbursements/reject",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/reimbursements/${id}/reject`, { reason });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reject");
    }
  }
);

export const deleteReimbursement = createAsyncThunk(
  "reimbursements/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/reimbursements/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete");
    }
  }
);

// ── Slice ──────────────────────────────────────────────────
const reimbursementSlice = createSlice({
  name: "reimbursements",
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
      // Fetch all
      .addCase(fetchReimbursements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReimbursements.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = Array.isArray(payload) ? payload : payload?.reimbursements || [];
      })
      .addCase(fetchReimbursements.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // Submit — add to top of list
      .addCase(submitReimbursement.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
      })

      // Approve — update in list
      .addCase(approveReimbursement.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((r) => r._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })

      // Reject — update in list
      .addCase(rejectReimbursement.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((r) => r._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })

      // Delete — remove from list
      .addCase(deleteReimbursement.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((r) => r._id !== payload);
      });
  },
});

export const { clearError } = reimbursementSlice.actions;
export default reimbursementSlice.reducer;