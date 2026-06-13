import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Spinner from "../components/common/Spinner";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, initialLoading } = useSelector(
    (state) => state.auth,
  );

  if (initialLoading) return <Spinner fullScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
