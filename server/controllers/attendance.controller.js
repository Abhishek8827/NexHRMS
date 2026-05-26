import Attendance from '../models/Attendance.model.js';
import WorkSchedule from '../models/WorkSchedule.model.js';
import User from '../models/User.model.js';
import Leave from '../models/Leave.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import dayjs from 'dayjs';

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
    punchInTime: { hour: 9, minute: 0 },
    gracePeriodMinutes: 15,
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

  const lateThreshold = scheduledStart.add(schedule.gracePeriodMinutes || 15, 'minute');
  const currentTime = dayjs(now);
  const isLate = currentTime.isAfter(lateThreshold);
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
  const standardMinutes = (schedule.standardHours || 8) * 60;

  const workingMinutes = dayjs(now).diff(dayjs(attendance.punchIn), 'minute');
  const overtimeMinutes = Math.max(0, workingMinutes - standardMinutes);

  // Determine final status
  let status = attendance.status; // keep 'late' or 'present'
  if (workingMinutes < standardMinutes / 2) {
    status = 'half-day'; // worked less than 4 hours
  }

  const updated = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: today },
    { $set: { punchOut: now, workingMinutes, overtimeMinutes, status } },
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
  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: today,
  });

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

  const records = await Attendance.find({
    employee: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const summary = {
    // FIXED: late + present both count as "attended"
    present: records.filter(r => ['present', 'late'].includes(r.status)).length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    halfDay: records.filter(r => r.status === 'half-day').length,
    onLeave: records.filter(r => r.status === 'on-leave').length,
    totalWorkingMinutes: records.reduce((s, r) => s + (r.workingMinutes || 0), 0),
    totalOvertimeMinutes: records.reduce((s, r) => s + (r.overtimeMinutes || 0), 0),
  };

  return res.status(200).json(
    new ApiResponse(200, { records, summary }, 'Attendance records fetched')
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
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, records, 'All attendance fetched')
  );
});