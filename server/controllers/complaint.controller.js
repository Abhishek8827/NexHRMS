import Complaint from '../models/Complaint.model.js';
import User from '../models/User.model.js';  // ← THIS WAS MISSING — caused crash
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notification.controller.js';

// GET /api/v1/complaints
export const getComplaints = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'employee') {
    filter.raisedBy = req.user._id;
  } else if (req.user.role === 'manager') {
    const team = await User.find({
      manager: req.user._id,
      status: 'active',
    }).select('_id');
    const teamIds = team.map(t => t._id);
    teamIds.push(req.user._id);
    filter.raisedBy = { $in: teamIds };
  }
  // admin and hr: no filter

  const complaints = await Complaint.find(filter)
    .populate('raisedBy', 'firstName lastName employeeId department')
    .populate('against', 'firstName lastName employeeId')
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 });

  // Hide anonymous reporter from non-admins
  const sanitized = complaints.map(c => {
    if (c.isAnonymous && req.user.role !== 'admin') {
      const obj = c.toObject();
      obj.raisedBy = { firstName: 'Anonymous', lastName: 'Employee', employeeId: '—' };
      return obj;
    }
    return c;
  });

  return res.status(200).json(
    new ApiResponse(200, sanitized, 'Complaints fetched')
  );
});

// POST /api/v1/complaints
export const createComplaint = asyncHandler(async (req, res) => {
  const { category, subject, description, against, isAnonymous, priority } = req.body;

  // Validate required fields explicitly
  if (!category) throw new ApiError(400, 'Category is required');
  if (!subject) throw new ApiError(400, 'Subject is required');
  if (!description) throw new ApiError(400, 'Description is required');

  // Save complaint first — do NOT let notification failure block this
  const complaint = await Complaint.create({
    raisedBy: req.user._id,
    category,
    subject,
    description,
    against: against || null,
    isAnonymous: Boolean(isAnonymous),
    priority: priority || 'medium',
    status: 'open',
  });

  // Fetch fresh user with manager field populated
  // req.user from auth middleware may not have manager populated
  const fullUser = await User.findById(req.user._id).select('manager firstName lastName');

  const reporterName = isAnonymous
    ? 'An employee (anonymous)'
    : `${req.user.firstName} ${req.user.lastName}`;

  // Notify Admin and HR — wrapped in try/catch so complaint still saves even if notification fails
  try {
    await createNotification({
      type: 'complaint_raised',
      title: '⚠️ New Complaint Filed',
      message: `${reporterName} filed a ${priority || 'medium'} priority complaint: "${subject}"`,
      link: '/complaints',
      recipientRoles: ['admin', 'hr'],
      createdBy: req.user._id,
      data: { complaintId: complaint._id },
    });

    // Also notify direct manager if the employee has one
    if (fullUser?.manager) {
      await createNotification({
        type: 'complaint_raised',
        title: '⚠️ Team Member Filed a Complaint',
        message: isAnonymous
          ? `A team member filed a complaint: "${subject}"`
          : `${req.user.firstName} ${req.user.lastName} filed a complaint: "${subject}"`,
        link: '/complaints',
        recipients: [fullUser.manager],
        createdBy: req.user._id,
        data: { complaintId: complaint._id },
      });
    }
  } catch (notifError) {
    // Log but don't fail the request
    console.error('Notification failed (complaint):', notifError.message);
  }

  return res.status(201).json(
    new ApiResponse(201, complaint, 'Complaint submitted successfully')
  );
});

// PATCH /api/v1/complaints/:id/status
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, resolution, assignedTo } = req.body;

  const complaint = await Complaint.findById(req.params.id)
    .populate('raisedBy', 'firstName lastName _id');

  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const previousStatus = complaint.status;
  complaint.status = status;
  if (resolution) complaint.resolution = resolution;
  if (assignedTo) complaint.assignedTo = assignedTo;
  if (['resolved', 'closed'].includes(status)) {
    complaint.resolvedAt = new Date();
  }
  await complaint.save();

  // Notify the person who raised complaint (only if non-anonymous)
  if (previousStatus !== status && !complaint.isAnonymous) {
    const msgs = {
      'under-review': 'Your complaint is now under review by HR',
      'action-taken': 'Action has been taken on your complaint',
      'resolved': `Your complaint has been resolved.${resolution ? ` Resolution: ${resolution}` : ''}`,
      'closed': 'Your complaint has been closed',
    };
    if (msgs[status]) {
      try {
        await createNotification({
          type: 'complaint_resolved',
          title: '📋 Complaint Status Updated',
          message: msgs[status],
          link: '/complaints',
          recipients: [complaint.raisedBy._id],
          createdBy: req.user._id,
        });
      } catch (e) {
        console.error('Notification failed (complaint status):', e.message);
      }
    }
  }

  const updated = await Complaint.findById(complaint._id)
    .populate('raisedBy', 'firstName lastName employeeId')
    .populate('assignedTo', 'firstName lastName')
    .populate('against', 'firstName lastName');

  return res.status(200).json(
    new ApiResponse(200, updated, 'Complaint status updated')
  );
});