import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isEmployee = user?.role === 'employee';
  const isAdminOrHR = isAdmin || isHR;

  return {
    user,
    isAuthenticated,
    loading,
    isAdmin,
    isHR,
    isEmployee,
    isAdminOrHR,
    canManageEmployees: isAdmin,
    canApproveLeaves: isAdmin,
  };
};

export default useAuth;
