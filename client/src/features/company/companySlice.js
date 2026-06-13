import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ── Thunks ─────────────────────────────────────────────────

export const fetchCompany = createAsyncThunk(
  "company/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/company");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch company");
    }
  }
);

export const updateCompany = createAsyncThunk(
  "company/update",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put("/company", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update company");
    }
  }
);

export const uploadCompanyLogo = createAsyncThunk(
  "company/uploadLogo",
  async ({ logoUrl }, { rejectWithValue }) => {
    try {
      const res = await api.post("/company/logo", { logoUrl });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to upload logo");
    }
  }
);

// Branches
export const addBranch = createAsyncThunk(
  "company/addBranch",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/company/branches", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add branch");
    }
  }
);

export const updateBranch = createAsyncThunk(
  "company/updateBranch",
  async ({ branchId, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/company/branches/${branchId}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update branch");
    }
  }
);

export const deleteBranch = createAsyncThunk(
  "company/deleteBranch",
  async (branchId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/company/branches/${branchId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete branch");
    }
  }
);

// Policies
export const addPolicy = createAsyncThunk(
  "company/addPolicy",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/company/policies", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add policy");
    }
  }
);

export const updatePolicy = createAsyncThunk(
  "company/updatePolicy",
  async ({ policyId, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/company/policies/${policyId}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update policy");
    }
  }
);

export const deletePolicy = createAsyncThunk(
  "company/deletePolicy",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/company/policies/${policyId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete policy");
    }
  }
);

export const updateOrgStructure = createAsyncThunk(
  "company/updateOrgStructure",
  async (orgStructure, { rejectWithValue }) => {
    try {
      const res = await api.put("/company/org-structure", { orgStructure });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update org structure");
    }
  }
);

// ── Slice ──────────────────────────────────────────────────
const companySlice = createSlice({
  name: "company",
  initialState: {
    profile: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchCompany.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCompany.fulfilled, (state, { payload }) => { state.loading = false; state.profile = payload; })
      .addCase(fetchCompany.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

    // Update company
      .addCase(updateCompany.pending, (state) => { state.saving = true; })
      .addCase(updateCompany.fulfilled, (state, { payload }) => { state.saving = false; state.profile = payload; })
      .addCase(updateCompany.rejected, (state, { payload }) => { state.saving = false; state.error = payload; })

    // Logo
      .addCase(uploadCompanyLogo.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.logo = payload.logo;
      })

    // Branches — all return updated branches array
      .addCase(addBranch.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.branches = payload;
      })
      .addCase(updateBranch.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.branches = payload;
      })
      .addCase(deleteBranch.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.branches = payload;
      })

    // Policies
      .addCase(addPolicy.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.policies = payload;
      })
      .addCase(updatePolicy.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.policies = payload;
      })
      .addCase(deletePolicy.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.policies = payload;
      })

    // Org structure
      .addCase(updateOrgStructure.fulfilled, (state, { payload }) => {
        if (state.profile) state.profile.orgStructure = payload;
      });
  },
});

export const { clearError } = companySlice.actions;
export default companySlice.reducer;