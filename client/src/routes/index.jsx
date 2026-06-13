import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../components/layout/Layout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import EmployeeList from "../pages/employees/EmployeeList";
import EmployeeForm from "../pages/employees/EmployeeForm";
import Attendance from "../pages/attendance/Attendance";
import Leaves from "../pages/leaves/Leaves";
import Payroll from "../pages/payroll/Payroll";
import Recruitment from "../pages/recruitment/Recruitment";
import Tasks from "../pages/tasks/Tasks";
import Performance from "../pages/performance/Performance";
import Reimbursements from "../pages/reimbursements/Reimbursements";
import Complaints from "../pages/complaints/Complaints";
import Reports from "../pages/reports/Reports";
import Profile from "../pages/profile/Profile";
import WorkSchedule from "../pages/settings/WorkSchedule";
import CompanyProfile from "../pages/company/CompanyProfile";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <Layout />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
          { path: "company", element: <CompanyProfile /> },
          // ── Employees ──────────────────────────────────────────
          {
            path: "employees",
            element: (
              <ProtectedRoute allowedRoles={["admin", "hr", "manager"]} />
            ),
            children: [
              { index: true, element: <EmployeeList /> },
              {
                path: "new",
                element: <ProtectedRoute allowedRoles={["admin", "hr"]} />,
                children: [{ index: true, element: <EmployeeForm /> }],
              },
              {
                path: ":id/edit",
                element: <ProtectedRoute allowedRoles={["admin", "hr"]} />,
                children: [{ index: true, element: <EmployeeForm /> }],
              },
            ],
          },
          // ── Work Schedules ─────────────────────────────────────
          {
            path: "settings/schedules",
            element: <ProtectedRoute allowedRoles={["admin", "hr"]} />,
            children: [{ index: true, element: <WorkSchedule /> }],
          },
          // ── All Roles ──────────────────────────────────────────
          { path: "attendance", element: <Attendance /> },
          { path: "leaves", element: <Leaves /> },
          { path: "tasks", element: <Tasks /> },
          { path: "performance", element: <Performance /> },
          { path: "reimbursements", element: <Reimbursements /> },
          { path: "complaints", element: <Complaints /> },
          // ── Admin + HR Only ────────────────────────────────────
          {
            path: "payroll",
            element: <ProtectedRoute allowedRoles={["admin", "hr"]} />,
            children: [{ index: true, element: <Payroll /> }],
          },
          {
            path: "recruitment",
            element: <ProtectedRoute allowedRoles={["admin", "hr"]} />,
            children: [{ index: true, element: <Recruitment /> }],
          },
          {
            path: "reports",
            element: <ProtectedRoute allowedRoles={["admin", "hr"]} />,
            children: [{ index: true, element: <Reports /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

const AppRoutes = () => <RouterProvider router={router} />;
export default AppRoutes;
