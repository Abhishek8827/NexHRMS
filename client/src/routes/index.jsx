import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import { FEATURE_ACCESS } from '../utils/featureAccess';

const Login = lazy(() => import('../pages/auth/Login'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const EmployeeList = lazy(() => import('../pages/employees/EmployeeList'));
const EmployeeForm = lazy(() => import('../pages/employees/EmployeeForm'));
const EmployeeDetails = lazy(() => import('../pages/employees/EmployeeDetails'));
const EmployeeSpreadsheetImport = lazy(() => import('../pages/employees/EmployeeSpreadsheetImport'));
const Attendance = lazy(() => import('../pages/attendance/Attendance'));
const AttendanceImports = lazy(() => import('../pages/attendance/AttendanceImports'));
const Leaves = lazy(() => import('../pages/leaves/Leaves'));
const Payroll = lazy(() => import('../pages/payroll/Payroll'));
const Reimbursements = lazy(() => import('../pages/reimbursements/Reimbursements'));
const Complaints = lazy(() => import('../pages/complaints/Complaints'));
const Reports = lazy(() => import('../pages/reports/Reports'));
const Profile = lazy(() => import('../pages/profile/Profile'));
const PayrollRules = lazy(() => import('../pages/settings/PayrollRules'));
const CompanyProfile = lazy(() => import('../pages/company/CompanyProfile'));

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <Layout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'profile', element: <Profile /> },
          {
            path: 'company',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
            children: [{ index: true, element: <CompanyProfile /> }],
          },
          {
            path: 'employees',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.employeeDirectory} />,
            children: [
              { index: true, element: <EmployeeList /> },
              {
                path: 'import',
                element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
                children: [{ index: true, element: <EmployeeSpreadsheetImport /> }],
              },
              { path: ':id', element: <EmployeeDetails /> },
              {
                path: 'new',
                element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
                children: [{ index: true, element: <EmployeeForm /> }],
              },
              {
                path: ':id/edit',
                element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
                children: [{ index: true, element: <EmployeeForm /> }],
              },
            ],
          },
          {
            path: 'settings/payroll-rules',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
            children: [{ index: true, element: <PayrollRules /> }],
          },
          { path: 'attendance', element: <Attendance /> },
          {
            path: 'attendance/imports',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.attendanceImport} />,
            children: [{ index: true, element: <AttendanceImports /> }],
          },
          {
            path: 'leaves',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
            children: [{ index: true, element: <Leaves /> }],
          },
          {
            path: 'reimbursements',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
            children: [{ index: true, element: <Reimbursements /> }],
          },
          {
            path: 'complaints',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.adminOperations} />,
            children: [{ index: true, element: <Complaints /> }],
          },
          { path: 'payroll', element: <Payroll /> },
          {
            path: 'reports',
            element: <ProtectedRoute allowedRoles={FEATURE_ACCESS.reports} />,
            children: [{ index: true, element: <Reports /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

const AppRoutes = () => (
  <Suspense fallback={<Spinner fullScreen />}>
    <RouterProvider router={router} />
  </Suspense>
);

export default AppRoutes;
