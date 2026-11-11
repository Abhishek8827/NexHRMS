import Leave from '../models/Leave.model.js';
import Attendance from '../models/Attendance.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notification.controller.js';
import dayjs from 'dayjs';

// ── Helper: count working days (skip Sat/Sun) ─────────────
const calcWorkingDays = (from, to) => {
  let count = 0;
  let current = dayjs(from);
  const end = dayjs(to);
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const day = current.day(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) count++;
    current = current.add(1, 'day');
  }
  return count;
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/leaves/apply
// Who can call: Any logged-in user (all roles)
// ─────────────────────────────────────────────────────────
export const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, from, to, reason, isHalfDay, halfDayType } = req.body;

  if (!leaveType || !from || !to || !reason) {
    throw new ApiError(400, 'Leave type, dates, and reason are required');
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (fromDate > toDate) {
    throw new ApiError(400, 'Start date cannot be after end date');
  }

  // Check for overlapping approved/pending leave
  const overlap = await Leave.findOne({
    employee: req.user._id,
    status: { $in: ['pending', 'approved'] },
    from: { $lte: toDate },
    to: { $gte: fromDate },
  });

  if (overlap) {
    throw new ApiError(
      400,
      'You already have a leave application overlapping with these dates'
    );
  }

  const numberOfDays = isHalfDay ? 0.5 : calcWorkingDays(fromDate, toDate);

  const leave = await Leave.create({
    employee: req.user._id,
    leaveType,
    from: fromDate,
    to: toDate,
    numberOfDays,
    reason,
    isHalfDay: isHalfDay || false,
    halfDayType: halfDayType || null,
  });

  const populated = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId');

  // Requests are routed to the Admin/HR operational group; there is no Manager role.
  await createNotification({
    type: 'leave_applied',
    title: 'New Leave Request',
    message: `${req.user.firstName} ${req.user.lastName} applied for ${leaveType.replace(/-/g, ' ')} leave (${numberOfDays} day${numberOfDays > 1 ? 's' : ''})`,
    link: '/leaves',
    recipientRoles: ['admin', 'hr'],
    createdBy: req.user._id,
    data: { leaveId: leave._id },
  });

  return res.status(201).json(
    new ApiResponse(201, populated, 'Leave application submitted successfully')
  );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/leaves/my
// Who can call: Any logged-in user (own leaves only)
// ─────────────────────────────────────────────────────────
export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id })
    .populate('actionBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, leaves, 'My leaves fetched')
  );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/leaves/pending
// Who can call: admin, hr
// Admin and HR can see all pending leaves
// ─────────────────────────────────────────────────────────
export const getPendingLeaves = asyncHandler(async (req, res) => {
  const filter = { status: 'pending' };



  const leaves = await Leave.find(filter)
    .populate('employee', 'firstName lastName employeeId department designation avatar')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, leaves, 'Pending leaves fetched')
  );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/leaves/all
// Who can call: admin, hr only
// ─────────────────────────────────────────────────────────
export const getAllLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const leaves = await Leave.find(filter)
    .populate('employee', 'firstName lastName employeeId department designation')
    .populate('actionBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, leaves, 'All leaves fetched')
  );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/leaves/:id/approve
// Who can call: Admin/HR only
// ─────────────────────────────────────────────────────────
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate('employee', 'firstName lastName _id');

  if (!leave) throw new ApiError(404, 'Leave not found');

  if (leave.status !== 'pending') {
    throw new ApiError(400, `Leave is already ${leave.status}`);
  }



  // Mark each working day as on-leave in Attendance
  let current = dayjs(leave.from);
  const end = dayjs(leave.to);
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const day = current.day();
    if (day !== 0 && day !== 6) {
      await Attendance.findOneAndUpdate(
        {
          employee: leave.employee._id,
          date: current.startOf('day').toDate(),
        },
        {
          $set: {
            employee: leave.employee._id,
            date: current.startOf('day').toDate(),
            status: 'on-leave',
            isManualEntry: true,
            markedBy: req.user._id,
            remarks: `${leave.leaveType} leave approved`,
          },
        },
        { upsert: true }
      );
    }
    current = current.add(1, 'day');
  }

  leave.status = 'approved';
  leave.actionBy = req.user._id;
  leave.actionDate = new Date();
  await leave.save();

  // ── NOTIFICATION: Tell the employee their leave was approved ──
  await createNotification({
    type: 'leave_approved',
    title: '✅ Leave Approved',
    message: `Your ${leave.leaveType.replace(/-/g, ' ')} leave from ${dayjs(leave.from).format('DD MMM')} to ${dayjs(leave.to).format('DD MMM YYYY')} has been approved by ${req.user.firstName} ${req.user.lastName}`,
    link: '/leaves',
    recipients: [leave.employee._id],
    createdBy: req.user._id,
    data: { leaveId: leave._id },
  });

  const updated = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('actionBy', 'firstName lastName');

  return res.status(200).json(
    new ApiResponse(200, updated, 'Leave approved successfully')
  );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/leaves/:id/reject
// Who can call: admin, hr
// ─────────────────────────────────────────────────────────
export const rejectLeave = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const leave = await Leave.findById(req.params.id)
    .populate('employee', 'firstName lastName _id');

  if (!leave) throw new ApiError(404, 'Leave not found');

  if (leave.status !== 'pending') {
    throw new ApiError(400, `Leave is already ${leave.status}`);
  }

  leave.status = 'rejected';
  leave.actionBy = req.user._id;
  leave.actionDate = new Date();
  leave.rejectionReason = reason || 'No reason provided';
  await leave.save();

  // ── NOTIFICATION: Tell the employee their leave was rejected ──
  await createNotification({
    type: 'leave_rejected',
    title: '❌ Leave Rejected',
    message: `Your ${leave.leaveType.replace(/-/g, ' ')} leave was rejected. Reason: ${reason || 'No reason provided'}`,
    link: '/leaves',
    recipients: [leave.employee._id],
    createdBy: req.user._id,
    data: { leaveId: leave._id },
  });

  const updated = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('actionBy', 'firstName lastName');

  return res.status(200).json(
    new ApiResponse(200, updated, 'Leave rejected')
  );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/leaves/:id/cancel
// Who can call: The employee who applied (own leave only)
// ─────────────────────────────────────────────────────────
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findOne({
    _id: req.params.id,
    employee: req.user._id,
  });

  if (!leave) throw new ApiError(404, 'Leave not found');

  if (leave.status !== 'pending') {
    throw new ApiError(400, 'Only pending leaves can be cancelled');
  }

  leave.status = 'cancelled';
  await leave.save();

  return res.status(200).json(
    new ApiResponse(200, leave, 'Leave cancelled')
  );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/leaves/balance
// Who can call: Any logged-in user (own balance)
// ─────────────────────────────────────────────────────────
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();

  const approvedLeaves = await Leave.find({
    employee: req.user._id,
    status: 'approved',
    from: {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    },
  });

  // Track how many days used per type
  const used = {
    casual: 0, sick: 0, earned: 0,
    maternity: 0, paternity: 0, 'loss-of-pay': 0,
  };

  approvedLeaves.forEach(l => {
    if (used[l.leaveType] !== undefined) {
      used[l.leaveType] += l.numberOfDays || 0;
    }
  });

  // Standard annual entitlements
  const entitlement = {
    casual: 12,
    sick: 12,
    earned: 15,
    maternity: 180,
    paternity: 15,
    'loss-of-pay': 0,
  };

  const balance = {};
  Object.keys(entitlement).forEach(type => {
    balance[type] = {
      entitled: entitlement[type],
      used: used[type] || 0,
      remaining: Math.max(0, entitlement[type] - (used[type] || 0)),
    };
  });

  return res.status(200).json(
    new ApiResponse(200, balance, 'Leave balance fetched')
  );
});