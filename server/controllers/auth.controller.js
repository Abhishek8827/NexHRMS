import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateEmployeeId } from '../utils/generateEmployeeId.js';
import { getFirebaseAuth } from '../config/firebase.js';

export const registerEmployee = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role = 'employee',
    department,
    designation,
    joiningDate,
    phone,
    attendanceCode,
    basicSalary = 0,
  } = req.body;

  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim()
  ) {
    throw new ApiError(400, 'Name, email, and a temporary password are required');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Temporary passwords must be at least 8 characters');
  }

  if (!['admin', 'hr', 'employee'].includes(role)) {
    throw new ApiError(400, 'Choose a valid account role');
  }

  if (req.user.role !== 'admin' && role !== 'employee') {
    throw new ApiError(403, 'Only an Admin can create Admin or HR accounts');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An employee with this email already exists');
  }

  const normalizedAttendanceCode = typeof attendanceCode === 'string'
    ? attendanceCode.trim()
    : '';
  if (normalizedAttendanceCode && await User.exists({ attendanceCode: normalizedAttendanceCode })) {
    throw new ApiError(409, 'This attendance system employee code is already assigned');
  }

  const firebaseAuth = getFirebaseAuth();
  let identity;

  try {
    identity = await firebaseAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      emailVerified: false,
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new ApiError(409, 'A Firebase account already exists for this email');
    }
    throw error;
  }

  try {
    const employee = await User.create({
      firebaseUid: identity.uid,
      employeeId: await generateEmployeeId(),
      attendanceCode: normalizedAttendanceCode || undefined,
      firstName,
      lastName,
      email: normalizedEmail,
      role,
      department,
      designation,
      joiningDate,
      phone,
      basicSalary,
    });

    const createdEmployee = await User.findById(employee._id)
      .select('-password -refreshToken')
      .populate('department', 'name code');

    return res.status(201).json(
      new ApiResponse(201, createdEmployee, 'Employee created successfully'),
    );
  } catch (error) {
    await firebaseAuth.deleteUser(identity.uid).catch(() => {});
    throw error;
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshToken')
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName designation');

  return res.status(200).json(new ApiResponse(200, user, 'User profile fetched'));
});
