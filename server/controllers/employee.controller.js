import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllEmployees = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10, search = '',
    department, status, role,
  } = req.query;

  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [employees, totalCount] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  return res.status(200).json(
    new ApiResponse(200, {
      employees,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasPrev: pageNum > 1,
        hasNext: pageNum < totalPages,
      },
    }, 'Employees fetched successfully')
  );
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id)
    .select('-password -refreshToken')
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName designation');

  if (!employee) throw new ApiError(404, 'Employee not found');

  if (
    req.user.role === 'employee' &&
    req.user._id.toString() !== req.params.id
  ) {
    throw new ApiError(403, 'You can only view your own profile');
  }

  return res.status(200).json(
    new ApiResponse(200, employee, 'Employee fetched')
  );
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'designation',
    'department', 'manager', 'joiningDate', 'dateOfBirth',
    'gender', 'address', 'emergencyContact', 'bankDetails',
    'basicSalary',
  ];

  if (req.user.role === 'admin') {
    allowedFields.push('role', 'status');
  }

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Remove empty strings — they fail enum/required validation
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === '' || updateData[key] === null) {
      delete updateData[key];
    }
  });

  const employee = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .select('-password -refreshToken')
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName designation');

  if (!employee) throw new ApiError(404, 'Employee not found');

  return res.status(200).json(
    new ApiResponse(200, employee, 'Employee updated successfully')
  );
});

export const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  if (employee._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  employee.status = 'terminated';
  employee.refreshToken = null;
  await employee.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, {}, 'Employee deactivated successfully')
  );
});