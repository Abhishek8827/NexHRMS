import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, isAuthenticated, loading, accessToken } = useSelector((state) => state.auth);

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';
  const isAdminOrHR = isAdmin || isHR;
  const canManageEmployees = isAdmin || isHR;
  const canApproveLeaves = isAdmin || isHR || isManager;

  return {
    user,
    isAuthenticated,
    loading,
    accessToken,
    isAdmin,
    isHR,
    isManager,
    isEmployee,
    isAdminOrHR,
    canManageEmployees,
    canApproveLeaves,
  };
};

export default useAuth;