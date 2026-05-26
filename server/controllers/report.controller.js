import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import Leave from '../models/Leave.model.js';
import Payroll from '../models/Payroll.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import dayjs from 'dayjs';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = dayjs().startOf('day').toDate();

  const [
    totalEmployees,
    activeEmployees,
    presentToday,
    pendingLeaves,
    thisMonthPayroll,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ status: 'active', role: { $ne: 'admin' } }),
    // ✅ CORRECT — counts both 'present' AND 'late' as attended
    Attendance.countDocuments({
      date: today,
      status: { $in: ['present', 'late'] },
    }),
    Leave.countDocuments({ status: 'pending' }),
    Payroll.aggregate([
      {
        $match: {
          month: dayjs().month() + 1,
          year: dayjs().year(),
          status: { $in: ['processed', 'paid'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$netSalary' } } },
    ]),
  ]);

  const onLeaveToday = await Attendance.countDocuments({
    date: today,
    status: 'on-leave',
  });

  // absentToday = active employees who didn't attend and aren't on leave
  const absentToday = activeEmployees - presentToday - onLeaveToday;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalEmployees,
        activeEmployees,
        presentToday,
        absentToday: Math.max(0, absentToday),
        onLeaveToday,
        pendingLeaves,
        monthlyPayroll: thisMonthPayroll[0]?.total || 0,
      },
      'Dashboard stats fetched'
    )
  );
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month) || dayjs().month() + 1;
  const year = parseInt(req.query.year) || dayjs().year();

  const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs(`${year}-${month}-01`).endOf('month').toDate();

  const records = await Attendance.find({
    date: { $gte: startDate, $lte: endDate },
  }).populate('employee', 'firstName lastName employeeId department');

  // Group attendance records by employee
  const byEmployee = {};

  records.forEach(r => {
    const empId = r.employee?._id?.toString();
    if (!empId) return;

    // Initialize employee entry if not exists
    if (!byEmployee[empId]) {
      byEmployee[empId] = {
        employee: r.employee,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
        totalMinutes: 0,
      };
    }

    // ── FIX: late = attended (present) + marked late ──────
    // Before fix: late only incremented late counter
    // After fix:  late increments BOTH present AND late counters
    // This matches real-world HR logic:
    // "Employee was late but they DID come to work"
    if (r.status === 'present') {
      byEmployee[empId].present++;
    } else if (r.status === 'late') {
      byEmployee[empId].present++;  // ← FIXED: late counts as present too
      byEmployee[empId].late++;      // ← also tracked as late separately
    } else if (r.status === 'absent') {
      byEmployee[empId].absent++;
    } else if (r.status === 'half-day') {
      byEmployee[empId].halfDay++;
      // half-day also counts as partial present
      byEmployee[empId].present += 0.5;
    } else if (r.status === 'on-leave') {
      byEmployee[empId].onLeave++;
    }

    // Always accumulate working minutes regardless of status
    byEmployee[empId].totalMinutes += r.workingMinutes || 0;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      Object.values(byEmployee),
      'Attendance report fetched'
    )
  );
});