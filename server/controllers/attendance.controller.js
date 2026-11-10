import Attendance from '../models/Attendance.model.js';
import AttendanceMonth from '../models/AttendanceMonth.model.js';
import WorkSchedule from '../models/WorkSchedule.model.js';
import User from '../models/User.model.js';
import Leave from '../models/Leave.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import dayjs from 'dayjs';
import {
  getHalfDayThresholdMinutes,
  getLateComingConversion,
} from '../utils/attendancePolicy.js';

// Helper: get the active schedule for an employee
const getScheduleForEmployee = async (employeeId) => {
  let schedule = await WorkSchedule.findOne({ employee: employeeId });

  if (!schedule) {
    const emp = await User.findById(employeeId).select('department');
    if (emp?.department) {
      schedule = await WorkSchedule.findOne({ department: emp.department });
    }
  }

  if (!schedule) {
    schedule = await WorkSchedule.findOne({ isDefault: true });
  }

  // Absolute fallback — built-in defaults
  return schedule || {
    shiftName: 'General Shift',
    punchInTime: { hour: 9, minute: 0 },
    gracePeriodMinutes: 15,
    lateMarkingEnabled: true,
    halfDayThresholdPercent: 50,
    punchOutTime: { hour: 18, minute: 0 },
    standardHours: 8,
    workingDays: [1, 2, 3, 4, 5],
  };
};

// POST /api/v1/attendance/punch-in
export const punchIn = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const now = new Date();
  const today = dayjs().startOf('day').toDate();

  const existing = await Attendance.findOne({ employee: employeeId, date: today });
  if (existing?.punchIn) {
    throw new ApiError(400, 'Already punched in today');
  }

  // Get this employee's configured schedule
  const schedule = await getScheduleForEmployee(employeeId);

  const scheduledStart = dayjs()
    .hour(schedule.punchInTime.hour)
    .minute(schedule.punchInTime.minute)
    .second(0);

  const gracePeriodMinutes = schedule.gracePeriodMinutes ?? 15;
  const halfDayThresholdPercent = schedule.halfDayThresholdPercent ?? 50;
  const lateMarkingEnabled = schedule.lateMarkingEnabled ?? true;
  const lateThreshold = scheduledStart.add(gracePeriodMinutes, 'minute');
  const currentTime = dayjs(now);
  const isLate = lateMarkingEnabled && currentTime.isAfter(lateThreshold);
  const lateByMinutes = isLate ? currentTime.diff(scheduledStart, 'minute') : 0;

  const attendance = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: today },
    {
      $set: {
        employee: employeeId,
        date: today,
        punchIn: now,
        // FIXED: status is always 'present' if they showed up
        // isLate flag separately tracks lateness
        // This ensures late employees are counted in present count
        status: isLate ? 'late' : 'present',
        isLate,
        lateByMinutes,
        punchReviewStatus: 'pending',
        policySnapshot: {
          shiftName: schedule.shiftName || 'General Shift',
          standardHours: schedule.standardHours ?? 8,
          gracePeriodMinutes,
          halfDayThresholdPercent,
          lateMarkingEnabled,
        },
        workMode: req.body.workMode || 'office',
      },
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, {
      attendance,
      hasPunchedIn: true,
      hasPunchedOut: false,
      message: isLate
        ? `Punched in. You are ${lateByMinutes} minutes late.`
        : 'Punched in on time. Good morning!',
    }, 'Punch in successful')
  );
});

// POST /api/v1/attendance/punch-out
export const punchOut = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const now = new Date();
  const today = dayjs().startOf('day').toDate();

  const attendance = await Attendance.findOne({ employee: employeeId, date: today });
  if (!attendance?.punchIn) throw new ApiError(400, 'You have not punched in today');
  if (attendance.punchOut) throw new ApiError(400, 'Already punched out today');

  const schedule = await getScheduleForEmployee(employeeId);
  const standardHours = attendance.policySnapshot?.standardHours
    ?? schedule.standardHours
    ?? 8;
  const halfDayThresholdPercent = attendance.policySnapshot?.halfDayThresholdPercent
    ?? schedule.halfDayThresholdPercent
    ?? 50;
  const standardMinutes = standardHours * 60;
  const halfDayThresholdMinutes = getHalfDayThresholdMinutes({
    standardHours,
    thresholdPercent: halfDayThresholdPercent,
  });

  const workingMinutes = dayjs(now).diff(dayjs(attendance.punchIn), 'minute');
  const overtimeMinutes = Math.max(0, workingMinutes - standardMinutes);

  // Use the policy saved at punch-in so later schedule edits do not change today's result.
  let status = attendance.status;
  if (workingMinutes < halfDayThresholdMinutes) {
    status = 'half-day';
  }

  const updated = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: today },
    {
      $set: {
        punchOut: now,
        workingMinutes,
        overtimeMinutes,
        status,
        punchReviewStatus: 'not-required',
      },
    },
    { new: true }
  );

  const h = Math.floor(workingMinutes / 60);
  const m = workingMinutes % 60;

  return res.status(200).json(
    new ApiResponse(200, {
      attendance: updated,
      hasPunchedIn: true,
      hasPunchedOut: true,
      summary: { hoursWorked: `${h}h ${m}m`, overtimeMinutes },
    }, `Punched out. Worked ${h}h ${m}m today.`)
  );
});

// GET /api/v1/attendance/today
export const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = dayjs().startOf('day').toDate();
  let attendance = await Attendance.findOne({
    employee: req.user._id,
    date: today,
  });

  if (!attendance) {
    const monthlyRecord = await AttendanceMonth.findOne({
      employee: req.user._id,
      month: dayjs().month() + 1,
      year: dayjs().year(),
    });
    const day = monthlyRecord?.days.find((record) => record.day === dayjs().date());
    if (day) {
      attendance = {
        date: day.date,
        punchIn: day.inTime,
        punchOut: day.outTime,
        workingMinutes: day.workMinutes || 0,
        overtimeMinutes: day.overtimeMinutes || 0,
        status: day.status,
        rawStatus: day.rawStatus,
      };
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      attendance: attendance || null,
      hasPunchedIn: !!attendance?.punchIn,
      hasPunchedOut: !!attendance?.punchOut,
    }, 'Today attendance status')
  );
});

// GET /api/v1/attendance/my
export const getMyAttendance = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month) || dayjs().month() + 1;
  const year = parseInt(req.query.year) || dayjs().year();
  const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs(`${year}-${month}-01`).endOf('month').toDate();

  const [legacyRecords, monthlyRecords] = await Promise.all([
    Attendance.find({
      employee: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 }),
    AttendanceMonth.find({ employee: req.user._id, month, year }).sort({ createdAt: -1 }),
  ]);

  const importedDays = monthlyRecords.flatMap((monthlyRecord) => monthlyRecord.days.map((day) => ({
    _id: `${monthlyRecord._id}-${day.day}`,
    employee: req.user._id,
    date: day.date,
    punchIn: day.inTime,
    punchOut: day.outTime,
    workingMinutes: day.workMinutes || 0,
    overtimeMinutes: day.overtimeMinutes || 0,
    status: day.status,
    rawStatus: day.rawStatus,
    breakMinutes: day.breakMinutes || 0,
    source: 'monthly-import',
  })));
  const importedDateKeys = new Set(importedDays.map((record) => dayjs(record.date).format('YYYY-MM-DD')));
  const records = [
    ...importedDays,
    ...legacyRecords.filter((record) => !importedDateKeys.has(dayjs(record.date).format('YYYY-MM-DD'))),
  ].sort((left, right) => new Date(left.date) - new Date(right.date));

  const lateComings = records.filter((record) => record.isLate || record.status === 'late').length;
  const summary = {
    // A half-day is half attended and half absent; no blank time is interpreted as absence.
    present: records.reduce((total, record) => total + (['present', 'late'].includes(record.status)
      ? 1 : record.status === 'half-day' ? 0.5 : 0), 0),
    absent: records.reduce((total, record) => total + (record.status === 'absent'
      ? 1 : record.status === 'half-day' ? 0.5 : 0), 0),
    late: lateComings,
    lateComingConversion: getLateComingConversion(lateComings),
    halfDay: records.filter((record) => record.status === 'half-day').length,
    onLeave: records.filter((record) => record.status === 'on-leave').length,
    holiday: records.filter((record) => record.status === 'holiday').length,
    weeklyOff: records.filter((record) => record.status === 'weekly-off').length,
    totalWorkingMinutes: records.reduce((sum, record) => sum + (record.workingMinutes || 0), 0),
    totalOvertimeMinutes: records.reduce((sum, record) => sum + (record.overtimeMinutes || 0), 0),
  };

  return res.status(200).json(
    new ApiResponse(200, { records, summary }, 'Attendance records fetched')
  );
});

// GET /api/v1/attendance/monthly — imported employee-month records
export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!Number.isInteger(month) || month < 1 || month > 12
      || !Number.isInteger(year) || year < 2000 || year > 2200) {
    throw new ApiError(400, 'Provide a valid month and year');
  }

  const filter = { month, year };
  if (req.user.role === 'employee') filter.employee = req.user._id;
  else if (req.query.employeeId) filter.employeeIdSnapshot = req.query.employeeId;

  const records = await AttendanceMonth.find(filter)
    .populate('employee', 'firstName lastName employeeId attendanceCode department designation')
    .populate('sourceImport', 'fileName reportMonthLabel status')
    .sort({ employeeNameSnapshot: 1 });

  return res.status(200).json(
    new ApiResponse(200, records, 'Monthly attendance records fetched')
  );
});

// GET /api/v1/attendance/team
export const getTeamAttendance = asyncHandler(async (req, res) => {
  const today = dayjs().startOf('day').toDate();
  const teamMembers = await User.find({
    manager: req.user._id,
    status: 'active',
  }).select('_id firstName lastName employeeId designation');

  const teamIds = teamMembers.map(m => m._id);
  const todayRecords = await Attendance.find({
    employee: { $in: teamIds },
    date: today,
  }).populate('employee', 'firstName lastName employeeId designation');

  return res.status(200).json(
    new ApiResponse(200, { team: teamMembers, attendance: todayRecords }, 'Team attendance fetched')
  );
});

// POST /api/v1/attendance/mark
export const manualMark = asyncHandler(async (req, res) => {
  const { employeeId, date, status, punchIn: pIn, punchOut: pOut, remarks } = req.body;
  if (!employeeId || !date || !status) {
    throw new ApiError(400, 'Employee ID, date, and status are required');
  }

  const markDate = dayjs(date).startOf('day').toDate();
  const attendance = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: markDate },
    {
      $set: {
        employee: employeeId,
        date: markDate,
        status,
        punchIn: pIn ? new Date(pIn) : null,
        punchOut: pOut ? new Date(pOut) : null,
        isManualEntry: true,
        markedBy: req.user._id,
        remarks: remarks || '',
      },
    },
    { upsert: true, new: true }
  ).populate('employee', 'firstName lastName employeeId');

  return res.status(200).json(
    new ApiResponse(200, attendance, 'Attendance marked successfully')
  );
});

// GET /api/v1/attendance/exceptions
// Past open punches are reviewed by Admin/HR; today's active shift is excluded.
export const getPunchExceptions = asyncHandler(async (req, res) => {
  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();
  const month = req.query.month === undefined ? currentMonth : Number(req.query.month);
  const year = req.query.year === undefined ? currentYear : Number(req.query.year);

  if (!Number.isInteger(month) || month < 1 || month > 12
    || !Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(400, 'Provide a valid month and year');
  }

  const startDate = dayjs(`${year}-${month}-01`).startOf('month');
  const endOfMonth = startDate.endOf('month');
  const lastCompletedDay = dayjs().startOf('day').subtract(1, 'millisecond');
  const endDate = endOfMonth.isAfter(lastCompletedDay) ? lastCompletedDay : endOfMonth;

  if (endDate.isBefore(startDate)) {
    return res.status(200).json(
      new ApiResponse(200, [], 'No completed days in this period'),
    );
  }

  const dateFilter = { $gte: startDate.toDate(), $lte: endDate.toDate() };
  const filter = req.query.includeResolved === 'true'
    ? {
      date: dateFilter,
      punchReviewStatus: 'resolved',
      'punchReviewHistory.0': { $exists: true },
    }
    : {
      punchIn: { $ne: null },
      punchOut: null,
      punchReviewStatus: { $ne: 'resolved' },
      date: dateFilter,
    };

  const records = await Attendance.find(filter)
    .populate('employee', 'firstName lastName employeeId department designation')
    .populate('punchReviewHistory.reviewedBy', 'firstName lastName')
    .sort({ date: -1, punchIn: -1 });

  return res.status(200).json(
    new ApiResponse(200, records, 'Punch exceptions fetched'),
  );
});

// PATCH /api/v1/attendance/:id/review
export const reviewPunchException = asyncHandler(async (req, res) => {
  const { action, punchOut: requestedPunchOut, reason } = req.body;
  const reviewReason = typeof reason === 'string' ? reason.trim() : '';

  if (!['confirmed-half-day', 'corrected-punch-out'].includes(action)) {
    throw new ApiError(400, 'Choose a valid punch review action');
  }
  if (reviewReason.length < 5) {
    throw new ApiError(400, 'Enter a review reason of at least 5 characters');
  }

  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new ApiError(404, 'Attendance record not found');
  if (!attendance.punchIn || attendance.punchOut) {
    throw new ApiError(409, 'This attendance record is no longer an open punch');
  }
  if (attendance.punchReviewStatus === 'resolved') {
    throw new ApiError(409, 'This punch exception has already been reviewed');
  }

  const previous = {
    punchOut: attendance.punchOut,
    status: attendance.status,
    workingMinutes: attendance.workingMinutes,
  };
  let updatedPunchOut = null;
  let updatedStatus = 'half-day';
  let updatedWorkingMinutes = attendance.workingMinutes || 0;

  if (action === 'corrected-punch-out') {
    updatedPunchOut = new Date(requestedPunchOut);
    if (!requestedPunchOut || Number.isNaN(updatedPunchOut.getTime())) {
      throw new ApiError(400, 'Provide a valid corrected punch-out time');
    }
    if (updatedPunchOut < attendance.punchIn || updatedPunchOut > new Date()) {
      throw new ApiError(400, 'Punch-out must be between punch-in and the current time');
    }

    const schedule = await getScheduleForEmployee(attendance.employee);
    const standardHours = attendance.policySnapshot?.standardHours
      ?? schedule.standardHours
      ?? 8;
    const halfDayThresholdPercent = attendance.policySnapshot?.halfDayThresholdPercent
      ?? schedule.halfDayThresholdPercent
      ?? 50;
    const halfDayThresholdMinutes = getHalfDayThresholdMinutes({
      standardHours,
      thresholdPercent: halfDayThresholdPercent,
    });

    updatedWorkingMinutes = dayjs(updatedPunchOut).diff(dayjs(attendance.punchIn), 'minute');
    updatedStatus = updatedWorkingMinutes < halfDayThresholdMinutes
      ? 'half-day'
      : attendance.isLate ? 'late' : 'present';

    attendance.punchOut = updatedPunchOut;
    attendance.workingMinutes = updatedWorkingMinutes;
    attendance.overtimeMinutes = Math.max(0, updatedWorkingMinutes - standardHours * 60);
    attendance.status = updatedStatus;
  } else {
    attendance.status = 'half-day';
  }

  attendance.punchReviewStatus = 'resolved';
  attendance.punchReviewHistory.push({
    reviewedBy: req.user._id,
    action,
    reason: reviewReason,
    previousPunchOut: previous.punchOut,
    previousStatus: previous.status,
    previousWorkingMinutes: previous.workingMinutes,
    updatedPunchOut,
    updatedStatus,
    updatedWorkingMinutes,
  });
  await attendance.save();
  await attendance.populate('employee', 'firstName lastName employeeId department designation');

  return res.status(200).json(
    new ApiResponse(200, attendance, 'Punch exception reviewed'),
  );
});

// GET /api/v1/attendance/all
export const getAllAttendance = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month) || dayjs().month() + 1;
  const year = parseInt(req.query.year) || dayjs().year();
  const { status } = req.query;

  const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs(`${year}-${month}-01`).endOf('month').toDate();

  const filter = { date: { $gte: startDate, $lte: endDate } };
  if (status) filter.status = status;

  const records = await Attendance.find(filter)
    .populate('employee', 'firstName lastName employeeId department designation')
    .populate('employee.department', 'name code')
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, records, 'All attendance fetched')
  );
});