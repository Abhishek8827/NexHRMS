import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '../utils/generateTokens.js';
import { generateEmployeeId } from '../utils/generateEmployeeId.js';
import jwt from 'jsonwebtoken';

export const registerEmployee = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, department, designation, joiningDate, phone, basicSalary } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new ApiError(409, 'Employee with this email already exists');

  const employeeId = await generateEmployeeId();

  const user = await User.create({
    employeeId, firstName, lastName, email, password,
    role: role || 'employee', department, designation,
    joiningDate, phone, basicSalary: basicSalary || 0,
  });

  const createdUser = await User.findById(user._id)
    .select('-password -refreshToken')
    .populate('department', 'name code');

  return res.status(201).json(new ApiResponse(201, createdUser, 'Employee created successfully'));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new ApiError(403, 'Account deactivated. Contact HR.');

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid email or password');

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);

  const loggedInUser = await User.findById(user._id)
    .select('-password -refreshToken')
    .populate('department', 'name code');

  return res.status(200).json(new ApiResponse(200, { user: loggedInUser, accessToken }, 'Login successful'));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, 'No refresh token. Please login again.');

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Refresh token expired. Please login again.');
  }

  const user = await User.findById(decoded._id).select('+refreshToken');

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Invalid refresh token. Please login again.');
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, newRefreshToken);

  return res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshToken')
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName designation');

  return res.status(200).json(new ApiResponse(200, user, 'User profile fetched'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) throw new ApiError(400, 'Both passwords are required');
  if (newPassword.length < 8) throw new ApiError(400, 'New password must be at least 8 characters');

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.isPasswordCorrect(currentPassword);

  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});