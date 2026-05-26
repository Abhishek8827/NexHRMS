import Job from '../models/Job.model.js';
import Candidate from '../models/Candidate.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notification.controller.js';

// ─────────────────────────────────────────────────────────
// GET /api/v1/jobs
// Who can call: All logged-in users
// Employees see only open jobs
// Admin/HR see all statuses
// ─────────────────────────────────────────────────────────
export const getJobs = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let filter = {};

  // Employees and managers only see open jobs
  if (req.user.role === 'employee' || req.user.role === 'manager') {
    filter.status = 'open';
  } else if (status) {
    // Admin/HR can filter by any status
    filter.status = status;
  }

  const jobs = await Job.find(filter)
    .populate('department', 'name')
    .populate('postedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, jobs, 'Jobs fetched')
  );
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/jobs
// Who can call: admin, hr only
// ─────────────────────────────────────────────────────────
export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({
    ...req.body,
    postedBy: req.user._id,
  });

  const populated = await Job.findById(job._id)
    .populate('department', 'name')
    .populate('postedBy', 'firstName lastName');

  // ── NOTIFICATION: Notify ALL employees and managers ────
  // Only send notification if job is published (not draft)
  if (job.status === 'open') {
    await createNotification({
      type: 'job_posted',
      title: '💼 New Job Opening',
      message: `New position available: ${job.title}${populated.department ? ` — ${populated.department.name}` : ''}. ${job.openings} opening${job.openings > 1 ? 's' : ''} available.`,
      link: '/recruitment',
      // Send to ALL employees and managers
      recipientRoles: ['employee', 'manager'],
      createdBy: req.user._id,
      data: { jobId: job._id },
    });
  }

  return res.status(201).json(
    new ApiResponse(201, populated, 'Job created successfully')
  );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/jobs/:id
// Who can call: admin, hr only
// ─────────────────────────────────────────────────────────
export const updateJob = asyncHandler(async (req, res) => {
  const previousJob = await Job.findById(req.params.id);
  if (!previousJob) throw new ApiError(404, 'Job not found');

  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  )
    .populate('department', 'name')
    .populate('postedBy', 'firstName lastName');

  // If job was draft and is now being opened — notify employees
  if (previousJob.status !== 'open' && job.status === 'open') {
    await createNotification({
      type: 'job_posted',
      title: '💼 New Job Opening',
      message: `Position now open: ${job.title}${job.department ? ` — ${job.department.name}` : ''}`,
      link: '/recruitment',
      recipientRoles: ['employee', 'manager'],
      createdBy: req.user._id,
      data: { jobId: job._id },
    });
  }

  return res.status(200).json(
    new ApiResponse(200, job, 'Job updated')
  );
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/jobs/:id
// Who can call: admin, hr only
// We close the job rather than hard-delete (preserves history)
// ─────────────────────────────────────────────────────────
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');

  await Job.findByIdAndUpdate(req.params.id, { status: 'closed' });

  return res.status(200).json(
    new ApiResponse(200, {}, 'Job closed successfully')
  );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/jobs/:jobId/candidates
// Who can call: admin, hr only
// ─────────────────────────────────────────────────────────
export const getJobCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({ job: req.params.jobId })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, candidates, 'Candidates fetched')
  );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/jobs/candidates/:id/stage
// Who can call: admin, hr only
// ─────────────────────────────────────────────────────────
export const updateCandidateStage = asyncHandler(async (req, res) => {
  const { stage, notes } = req.body;

  const candidate = await Candidate.findByIdAndUpdate(
    req.params.id,
    { $set: { stage, notes } },
    { new: true }
  );

  if (!candidate) throw new ApiError(404, 'Candidate not found');

  return res.status(200).json(
    new ApiResponse(200, candidate, 'Stage updated successfully')
  );
});