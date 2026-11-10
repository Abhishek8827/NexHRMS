export const hasAllowedRole = (userRole, allowedRoles) =>
  Array.isArray(allowedRoles) && allowedRoles.includes(userRole);
