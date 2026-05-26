import User from '../models/User.model.js';

export const generateEmployeeId = async () => {
  const lastEmployee = await User.findOne({
    employeeId: { $exists: true, $ne: null }
  }).sort({ createdAt: -1 });

  if (!lastEmployee || !lastEmployee.employeeId) {
    return 'EMP-001';
  }

  const lastNumber = parseInt(lastEmployee.employeeId.split('-')[1]);
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `EMP-${newNumber}`;
};