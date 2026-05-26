import WorkSchedule from '../models/WorkSchedule.model.js';
import User from '../models/User.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/v1/schedules — list all schedules
export const getAllSchedules = asyncHandler(async (req, res) => {
  const schedules = await WorkSchedule.find()
    .populate('employee', 'firstName lastName employeeId designation')
    .populate('department', 'name code')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, schedules, 'Schedules fetched')
  );
});

// GET /api/v1/schedules/employee/:empId — get schedule for a specific employee
export const getEmployeeSchedule = asyncHandler(async (req, res) => {
  const empId = req.params.empId || req.user._id;

  // Priority: employee-specific > department > default
  let schedule = await WorkSchedule.findOne({ employee: empId });

  if (!schedule) {
    const emp = await User.findById(empId).select('department');
    if (emp?.department) {
      schedule = await WorkSchedule.findOne({ department: emp.department });
    }
  }

  if (!schedule) {
    schedule = await WorkSchedule.findOne({ isDefault: true });
  }

  // If absolutely nothing exists — return built-in defaults
  if (!schedule) {
    schedule = {
      shiftName: 'General Shift',
      workingDays: [1, 2, 3, 4, 5],
      punchInTime: { hour: 9, minute: 0 },
      gracePeriodMinutes: 15,
      punchOutTime: { hour: 18, minute: 0 },
      standardHours: 8,
    };
  }

  return res.status(200).json(
    new ApiResponse(200, schedule, 'Schedule fetched')
  );
});

// POST /api/v1/schedules — create schedule
export const createSchedule = asyncHandler(async (req, res) => {
  const {
    employee, department, shiftName,
    workingDays, punchInTime, punchOutTime,
    gracePeriodMinutes, standardHours, isDefault,
  } = req.body;

  if (!employee && !department && !isDefault) {
    throw new ApiError(400, 'Assign schedule to an employee, department, or set as default');
  }

  // If setting as default, unset any existing default
  if (isDefault) {
    await WorkSchedule.updateMany({ isDefault: true }, { isDefault: false });
  }

  const schedule = await WorkSchedule.create({
    employee: employee || null,
    department: department || null,
    shiftName: shiftName || 'General Shift',
    workingDays: workingDays || [1, 2, 3, 4, 5],
    punchInTime: punchInTime || { hour: 9, minute: 0 },
    punchOutTime: punchOutTime || { hour: 18, minute: 0 },
    gracePeriodMinutes: gracePeriodMinutes ?? 15,
    standardHours: standardHours || 8,
    isDefault: Boolean(isDefault),
    createdBy: req.user._id,
  });

  const populated = await WorkSchedule.findById(schedule._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('department', 'name code');

  return res.status(201).json(
    new ApiResponse(201, populated, 'Schedule created')
  );
});

// PUT /api/v1/schedules/:id — update schedule
export const updateSchedule = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await WorkSchedule.updateMany({ isDefault: true }, { isDefault: false });
  }

  const schedule = await WorkSchedule.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  )
    .populate('employee', 'firstName lastName employeeId')
    .populate('department', 'name code');

  if (!schedule) throw new ApiError(404, 'Schedule not found');

  return res.status(200).json(
    new ApiResponse(200, schedule, 'Schedule updated')
  );
});

// DELETE /api/v1/schedules/:id
export const deleteSchedule = asyncHandler(async (req, res) => {
  await WorkSchedule.findByIdAndDelete(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, {}, 'Schedule deleted')
  );
});