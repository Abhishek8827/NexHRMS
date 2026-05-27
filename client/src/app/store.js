import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import employeeReducer from '../features/employees/employeeSlice';
import attendanceReducer from '../features/attendance/attendanceSlice';
import leaveReducer from '../features/leaves/leaveSlice';
import payrollReducer from '../features/payroll/payrollSlice';
import recruitmentReducer from '../features/recruitment/recruitmentSlice';
import taskReducer from '../features/tasks/taskSlice';
import notificationReducer from '../features/notifications/notificationSlice';
import performanceReducer from '../features/performance/performanceSlice';
import complaintReducer from '../features/complaints/complaintSlice';
import reimbursementReducer from '../features/reimbursements/reimbursementSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    attendance: attendanceReducer,
    leaves: leaveReducer,
    payroll: payrollReducer,
    recruitment: recruitmentReducer,
    tasks: taskReducer,
    notifications: notificationReducer,
    performance: performanceReducer,
    complaints: complaintReducer,
    reimbursements: reimbursementReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export default store;