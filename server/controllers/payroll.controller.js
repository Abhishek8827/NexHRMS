import Payroll from '../models/Payroll.model.js';
import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import dayjs from 'dayjs';

// ── Payroll Calculation Engine ─────────────────────────────
const calculatePayroll = (basicSalary, presentDays, workingDays, lopDays = 0) => {
  // Per-day salary
  const perDaySalary = basicSalary / workingDays;

  // LOP deduction
  const lopDeduction = lopDays * perDaySalary;

  // Earnings
  const hra = basicSalary * 0.4;               // 40% of basic
  const conveyanceAllowance = 1600;             // Fixed ₹1600
  const medicalAllowance = 1250;                // Fixed ₹1250
  const specialAllowance = basicSalary * 0.1;  // 10% of basic

  const grossSalary = basicSalary + hra + conveyanceAllowance
    + medicalAllowance + specialAllowance - lopDeduction;

  // Deductions
  const epfEmployee = basicSalary * 0.12;      // 12% of basic
  const epfEmployer = basicSalary * 0.12;      // 12% employer contribution
  const esicApplicable = grossSalary <= 21000;
  const esicEmployee = esicApplicable ? grossSalary * 0.0075 : 0;
  const esicEmployer = esicApplicable ? grossSalary * 0.0325 : 0;

  // Professional Tax (Maharashtra slab)
  let professionalTax = 0;
  if (grossSalary > 15000) professionalTax = 200;
  else if (grossSalary > 10000) professionalTax = 150;
  else if (grossSalary > 7500) professionalTax = 175;

  const totalDeductions = epfEmployee + esicEmployee + professionalTax + lopDeduction;
  const netSalary = grossSalary - totalDeductions + lopDeduction; // lopDeduction already applied to gross

  return {
    basicSalary: Math.round(basicSalary),
    hra: Math.round(hra),
    conveyanceAllowance,
    medicalAllowance,
    specialAllowance: Math.round(specialAllowance),
    epfEmployee: Math.round(epfEmployee),
    epfEmployer: Math.round(epfEmployer),
    esicEmployee: Math.round(esicEmployee),
    esicEmployer: Math.round(esicEmployer),
    professionalTax,
    lopDeduction: Math.round(lopDeduction),
    grossSalary: Math.round(grossSalary),
    totalDeductions: Math.round(totalDeductions),
    netSalary: Math.round(grossSalary - epfEmployee - esicEmployee - professionalTax),
  };
};

// POST /api/v1/payroll/process — Process payroll for one employee
export const processPayroll = asyncHandler(async (req, res) => {
  const { employeeId, month, year, bonus = 0, overtimePay = 0 } = req.body;

  if (!employeeId || !month || !year) {
    throw new ApiError(400, 'Employee ID, month, and year are required');
  }

  // Check if payroll already processed
  const existing = await Payroll.findOne({ employee: employeeId, month, year });
  if (existing && existing.status !== 'draft') {
    throw new ApiError(400, `Payroll for this month is already ${existing.status}`);
  }

  const employee = await User.findById(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  // Get attendance data for the month
  const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs(`${year}-${month}-01`).endOf('month').toDate();

  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  });

  // Count working days (Mon-Fri) in the month
  let workingDays = 0;
  let current = dayjs(startDate);
  while (current.isBefore(dayjs(endDate)) || current.isSame(dayjs(endDate), 'day')) {
    if (current.day() !== 0 && current.day() !== 6) workingDays++;
    current = current.add(1, 'day');
  }

  const presentDays = attendanceRecords.filter(
    r => ['present', 'late', 'half-day'].includes(r.status)
  ).length;

  const absentDays = workingDays - presentDays - attendanceRecords.filter(
    r => r.status === 'on-leave'
  ).length;

  const lopDays = Math.max(0, absentDays);

  const calculated = calculatePayroll(
    employee.basicSalary || 0,
    presentDays,
    workingDays,
    lopDays
  );

  const payrollData = {
    ...calculated,
    employee: employeeId,
    month,
    year,
    bonus: Number(bonus),
    overtimePay: Number(overtimePay),
    workingDays,
    presentDays,
    absentDays,
    lopDays,
    grossSalary: calculated.grossSalary + Number(bonus) + Number(overtimePay),
    netSalary: calculated.netSalary + Number(bonus) + Number(overtimePay),
    status: 'processed',
    processedBy: req.user._id,
    processedAt: new Date(),
  };

  const payroll = await Payroll.findOneAndUpdate(
    { employee: employeeId, month, year },
    { $set: payrollData },
    { upsert: true, new: true }
  ).populate('employee', 'firstName lastName employeeId designation');

  return res.status(200).json(
    new ApiResponse(200, payroll, 'Payroll processed successfully')
  );
});

// GET /api/v1/payroll/my — Employee sees own payslips
export const getMyPayroll = asyncHandler(async (req, res) => {
  const payrolls = await Payroll.find({ employee: req.user._id })
    .sort({ year: -1, month: -1 });

  return res.status(200).json(
    new ApiResponse(200, payrolls, 'My payroll records fetched')
  );
});

// GET /api/v1/payroll — HR/Admin sees all
export const getAllPayroll = asyncHandler(async (req, res) => {
  const { month, year, status } = req.query;
  const filter = {};
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);
  if (status) filter.status = status;

  const payrolls = await Payroll.find(filter)
    .populate('employee', 'firstName lastName employeeId department designation')
    .sort({ year: -1, month: -1 });

  return res.status(200).json(
    new ApiResponse(200, payrolls, 'Payroll records fetched')
  );
});

// GET /api/v1/payroll/ctc/:employeeId — CTC breakdown
export const getCTCBreakdown = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.employeeId)
    .select('firstName lastName employeeId basicSalary designation');

  if (!employee) throw new ApiError(404, 'Employee not found');

  const monthly = calculatePayroll(employee.basicSalary || 0, 26, 26, 0);

  const annual = {
    basicSalary: monthly.basicSalary * 12,
    hra: monthly.hra * 12,
    conveyanceAllowance: monthly.conveyanceAllowance * 12,
    medicalAllowance: monthly.medicalAllowance * 12,
    specialAllowance: monthly.specialAllowance * 12,
    grossSalary: monthly.grossSalary * 12,
    epfEmployer: monthly.epfEmployer * 12,
    esicEmployer: monthly.esicEmployer * 12,
    ctc: (monthly.grossSalary + monthly.epfEmployer + monthly.esicEmployer) * 12,
  };

  return res.status(200).json(
    new ApiResponse(200, {
      employee,
      monthly,
      annual,
    }, 'CTC breakdown fetched')
  );
});

// PUT /api/v1/payroll/:id/pay — Mark as paid
export const markAsPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'paid', paidAt: new Date() } },
    { new: true }
  );

  if (!payroll) throw new ApiError(404, 'Payroll record not found');

  return res.status(200).json(
    new ApiResponse(200, payroll, 'Payroll marked as paid')
  );
});