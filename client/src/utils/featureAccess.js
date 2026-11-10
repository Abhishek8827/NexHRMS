const ALL_AUTHENTICATED_ROLES = Object.freeze(['admin', 'hr', 'employee']);
const ADMIN_AND_HR = Object.freeze(['admin', 'hr']);
const ADMIN_ONLY = Object.freeze(['admin']);

// Keep module visibility rules in one place. Backend authorization remains the
// security boundary; this matrix only controls client navigation and routes.
export const FEATURE_ACCESS = Object.freeze({
  dashboard: ALL_AUTHENTICATED_ROLES,
  profile: ALL_AUTHENTICATED_ROLES,
  company: ADMIN_ONLY,
  employeeDirectory: ADMIN_AND_HR,
  employeeManagement: ADMIN_ONLY,
  attendance: ALL_AUTHENTICATED_ROLES,
  attendanceImport: ADMIN_ONLY,
  payroll: ALL_AUTHENTICATED_ROLES,
  reports: ADMIN_AND_HR,
  adminOperations: ADMIN_ONLY,
});
