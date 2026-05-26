import PerformanceReview from '../models/PerformanceReview.model.js';
import User from '../models/User.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notification.controller.js';

// GET /api/v1/performance/my
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await PerformanceReview.find({ employee: req.user._id })
    .populate('reviewer', 'firstName lastName designation')
    .sort({ year: -1, quarter: -1 });

  return res.status(200).json(
    new ApiResponse(200, reviews, 'My reviews fetched')
  );
});

// GET /api/v1/performance
export const getAllReviews = asyncHandler(async (req, res) => {
  const { year, quarter, status, employee } = req.query;
  const filter = {};

  if (year) filter.year = parseInt(year);
  if (quarter) filter.quarter = parseInt(quarter);
  if (status) filter.status = status;
  if (employee) filter.employee = employee;

  // Managers only see their team
  if (req.user.role === 'manager') {
    const team = await User.find({
      manager: req.user._id
    }).select('_id');
    filter.employee = { $in: team.map(t => t._id) };
  }

  const reviews = await PerformanceReview.find(filter)
    .populate('employee', 'firstName lastName employeeId designation department')
    .populate('reviewer', 'firstName lastName designation')
    .sort({ year: -1, quarter: -1 });

  return res.status(200).json(
    new ApiResponse(200, reviews, 'Reviews fetched')
  );
});

// POST /api/v1/performance
export const createReview = asyncHandler(async (req, res) => {
  const { employeeId, quarter, year, goals } = req.body;

  if (!employeeId || !quarter || !year) {
    throw new ApiError(400, 'Employee, quarter and year are required');
  }

  // Check duplicate
  const existing = await PerformanceReview.findOne({
    employee: employeeId,
    quarter: parseInt(quarter),
    year: parseInt(year),
  });

  if (existing) {
    throw new ApiError(409, `Review for Q${quarter} ${year} already exists for this employee`);
  }

  const defaultGoals = goals || [
    { title: 'Goal 1', target: '', achieved: '', score: null, weight: 25 },
    { title: 'Goal 2', target: '', achieved: '', score: null, weight: 25 },
    { title: 'Goal 3', target: '', achieved: '', score: null, weight: 25 },
    { title: 'Goal 4', target: '', achieved: '', score: null, weight: 25 },
  ];

  const defaultCompetencies = [
    { name: 'Communication', score: null, comments: '' },
    { name: 'Teamwork', score: null, comments: '' },
    { name: 'Problem Solving', score: null, comments: '' },
    { name: 'Technical Skills', score: null, comments: '' },
    { name: 'Initiative', score: null, comments: '' },
  ];

  const review = await PerformanceReview.create({
    employee: employeeId,
    reviewer: req.user._id,
    quarter: parseInt(quarter),
    year: parseInt(year),
    goals: defaultGoals,
    competencies: defaultCompetencies,
    status: 'draft',
  });

  // Notify employee
  await createNotification({
    type: 'general',
    title: 'Performance Review Started',
    message: `Your Q${quarter} ${year} performance review has been initiated`,
    link: '/performance',
    recipients: [employeeId],
    createdBy: req.user._id,
  });

  const populated = await PerformanceReview.findById(review._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('reviewer', 'firstName lastName');

  return res.status(201).json(
    new ApiResponse(201, populated, 'Review created')
  );
});

// PUT /api/v1/performance/:id
export const updateReview = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  )
    .populate('employee', 'firstName lastName employeeId')
    .populate('reviewer', 'firstName lastName');

  if (!review) throw new ApiError(404, 'Review not found');

  return res.status(200).json(
    new ApiResponse(200, review, 'Review updated')
  );
});

// PUT /api/v1/performance/:id/self-review
export const submitSelfReview = asyncHandler(async (req, res) => {
  const { selfRating, selfComments, goals } = req.body;

  const review = await PerformanceReview.findOne({
    _id: req.params.id,
    employee: req.user._id,
  });

  if (!review) throw new ApiError(404, 'Review not found');
  if (!['draft', 'self-review'].includes(review.status)) {
    throw new ApiError(400, 'Self review cannot be submitted at this stage');
  }

  review.selfRating = selfRating;
  review.selfComments = selfComments;
  if (goals) review.goals = goals;
  review.status = 'manager-review';
  await review.save();

  // Notify reviewer (manager/HR)
  await createNotification({
    type: 'general',
    title: 'Self Review Submitted',
    message: `${req.user.firstName} ${req.user.lastName} has submitted their self review for Q${review.quarter} ${review.year}`,
    link: '/performance',
    recipients: [review.reviewer],
    createdBy: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, review, 'Self review submitted')
  );
});

// PUT /api/v1/performance/:id/manager-review
export const submitManagerReview = asyncHandler(async (req, res) => {
  const {
    managerRating, managerComments,
    competencies, overallScore, grade,
    nextPeriodGoals,
  } = req.body;

  const review = await PerformanceReview.findById(req.params.id)
    .populate('employee', 'firstName lastName _id');

  if (!review) throw new ApiError(404, 'Review not found');

  review.managerRating = managerRating;
  review.managerComments = managerComments;
  if (competencies) review.competencies = competencies;
  review.overallScore = overallScore;
  review.grade = grade;
  if (nextPeriodGoals) review.nextPeriodGoals = nextPeriodGoals;
  review.status = 'acknowledged';
  await review.save();

  // Notify employee
  await createNotification({
    type: 'general',
    title: 'Performance Review Completed',
    message: `Your Q${review.quarter} ${review.year} review has been completed. Overall grade: ${grade}`,
    link: '/performance',
    recipients: [review.employee._id],
    createdBy: req.user._id,
  });

  const populated = await PerformanceReview.findById(review._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('reviewer', 'firstName lastName');

  return res.status(200).json(
    new ApiResponse(200, populated, 'Manager review submitted')
  );
});