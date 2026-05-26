import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/employees', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/employees/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/employees/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const deactivateEmployee = createAsyncThunk(
  'employees/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/employees/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchDepartments = createAsyncThunk(
  'employees/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/departments');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    list: [],
    selected: null,
    departments: [],
    pagination: {},
    loading: false,
    formLoading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => { state.selected = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.employees;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch one
      .addCase(fetchEmployeeById.pending, (state) => {
        state.formLoading = true;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.formLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state) => {
        state.formLoading = false;
      })
      // Create
      .addCase(createEmployee.pending, (state) => {
        state.formLoading = true;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.formLoading = false;
        state.list.unshift(action.payload);
        if (state.pagination.totalCount !== undefined) {
          state.pagination.totalCount += 1;
        }
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.formLoading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateEmployee.pending, (state) => {
        state.formLoading = true;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.formLoading = false;
        const idx = state.list.findIndex(e => e._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.formLoading = false;
        state.error = action.payload;
      })
      // Deactivate
      .addCase(deactivateEmployee.fulfilled, (state, action) => {
        const idx = state.list.findIndex(e => e._id === action.payload);
        if (idx !== -1) state.list[idx].status = 'terminated';
      })
      // Departments
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      });
  },
});

export const { clearSelected, clearError } = employeeSlice.actions;
export default employeeSlice.reducer;