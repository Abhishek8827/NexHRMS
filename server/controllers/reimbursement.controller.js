import Reimbursement from '../models/Reimbursement.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notification.controller.js';
import User from '../models/User.model.js'

// ─────────────────────────────────────────────────────────
// GET /api/v1/reimbursements/my
// Who can call: Any logged-in user (own records)
// ─────────────────────────────────────────────────────────
export const getMyReimbursements = asyncHandler(async (req, res) => {
  const reimbursements = await Reimbursement.find({ employee: req.user._id })
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, reimbursements, 'My reimbursements fetched')
  );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/reimbursements
// Who sees what:
// - Admin: ALL reimbursements
// - HR: ALL reimbursements
// - Manager: their OWN + their team's reimbursements
// - Employee: redirect to /my (handled by frontend)
// ─────────────────────────────────────────────────────────
export const getAllReimbursements = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (req.user.role === 'manager') {
    // Manager sees own + team's reimbursements
    const User = (await import('../models/User.model.js')).default;
    const team = await User.find({
      manager: req.user._id,
      status: 'active',
    }).select('_id');

    const teamIds = team.map(t => t._id);
    teamIds.push(req.user._id);
    filter.employee = { $in: teamIds };
  }
  // Admin and HR: no employee filter — see all

  const reimbursements = await Reimbursement.find(filter)
    .populate('employee', 'firstName lastName employeeId department designation')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, reimbursements, 'Reimbursements fetched')
  );
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/reimbursements
// Who can call: Any logged-in user
// ─────────────────────────────────────────────────────────
export const createReimbursement = asyncHandler(async (req, res) => {
  const { category, amount, expenseDate, description } = req.body;

  if (!category || !amount || !expenseDate || !description) {
    throw new ApiError(400, 'Category, amount, date, and description are required');
  }

  const reimbursement = await Reimbursement.create({
    ...req.body,
    employee: req.user._id,
  });

  // ── NOTIFICATION FLOW ──────────────────────────────────
  // Always notify Admin and HR
 // After reimbursement created — fetch manager separately
const fullUser = await User.findById(req.user._id).select('manager');

await createNotification({
  type: 'general',
  title: '💰 New Reimbursement Request',
  message: `${req.user.firstName} ${req.user.lastName} submitted a ₹${Number(amount).toLocaleString('en-IN')} ${category} reimbursement request`,
  link: '/reimbursements',
  recipientRoles: ['admin', 'hr'],
  recipients: fullUser?.manager ? [fullUser.manager] : [],
  createdBy: req.user._id,
  data: { reimbursementId: reimbursement._id },
});

  // Also notify direct manager if employee has one
  if (req.user.manager) {
    await createNotification({
      type: 'general',
      title: '💰 Team Reimbursement Request',
      message: `${req.user.firstName} ${req.user.lastName} submitted a ₹${Number(amount).toLocaleString('en-IN')} ${category} reimbursement request`,
      link: '/reimbursements',
      recipients: [req.user.manager],
      createdBy: req.user._id,
      data: { reimbursementId: reimbursement._id },
    });
  }

  const populated = await Reimbursement.findById(reimbursement._id)
    .populate('employee', 'firstName lastName employeeId');

  return res.status(201).json(
    new ApiResponse(201, populated, 'Reimbursement request submitted')
  );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/reimbursements/:id/status
// Who can call: admin, hr only
// ─────────────────────────────────────────────────────────
export const updateReimbursementStatus = asyncHandler(async (req, res) => {
  const { status, approvedAmount, remarks } = req.body;

  const reimbursement = await Reimbursement.findById(req.params.id)
    .populate('employee', 'firstName lastName _id');

  if (!reimbursement) throw new ApiError(404, 'Request not found');

  const previousStatus = reimbursement.status;

  reimbursement.status = status;
  reimbursement.approvedAmount = approvedAmount || reimbursement.amount;
  reimbursement.remarks = remarks || '';
  reimbursement.approvedBy = req.user._id;
  reimbursement.approvedAt = new Date();

  if (status === 'paid') {
    reimbursement.paidAt = new Date();
  }

  await reimbursement.save();

  // ── NOTIFICATION: Tell employee the status changed ─────
  if (previousStatus !== status) {
    const statusMessages = {
      approved: `Your ₹${reimbursement.approvedAmount?.toLocaleString('en-IN')} ${reimbursement.category} reimbursement has been approved`,
      rejected: `Your ${reimbursement.category} reimbursement request was rejected. ${remarks ? `Reason: ${remarks}` : ''}`,
      paid: `Your ₹${reimbursement.approvedAmount?.toLocaleString('en-IN')} ${reimbursement.category} reimbursement has been paid to your account`,
    };

    const message = statusMessages[status];
    if (message) {
      await createNotification({
        type: 'general',
        title: status === 'approved'
          ? '✅ Reimbursement Approved'
          : status === 'paid'
          ? '💰 Reimbursement Paid'
          : '❌ Reimbursement Rejected',
        message,
        link: '/reimbursements',
        recipients: [reimbursement.employee._id],
        createdBy: req.user._id,
        data: { reimbursementId: reimbursement._id, status },
      });
    }
  }

  const updated = await Reimbursement.findById(reimbursement._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('approvedBy', 'firstName lastName');

  return res.status(200).json(
    new ApiResponse(200, updated, 'Status updated successfully')
  );
});