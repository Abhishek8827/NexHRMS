import Payroll from '../models/Payroll.model.js';
import User from '../models/User.model.js';
import AttendanceMonth from '../models/AttendanceMonth.model.js';
import AttendanceImport from '../models/AttendanceImport.model.js';
import PayrollRule from '../models/PayrollRule.model.js';
import { calculateSalaryDraft } from '../utils/salaryCalculator.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import dayjs from 'dayjs';
import mongoose from 'mongoose';

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

// POST /api/v1/payroll/process — Generate a reviewable salary draft from imported monthly attendance
export const processPayroll = asyncHandler(async (req, res) => {
  const employeeId = String(req.body.employeeId || '');
  const month = Number(req.body.month);
  const year = Number(req.body.year);

  if (!mongoose.Types.ObjectId.isValid(employeeId)
      || !Number.isInteger(month) || month < 1 || month > 12
      || !Number.isInteger(year) || year < 2000 || year > 2200) {
    throw new ApiError(400, 'Employee, valid month, and valid year are required.');
  }

  const existing = await Payroll.findOne({ employee: employeeId, month, year });
  if (existing) {
    throw new ApiError(409, 'A salary record already exists for this employee and month. Open it for review; generated records are not silently replaced.');
  }

  const employee = await User.findById(employeeId).select('firstName lastName employeeId basicSalary');
  if (!employee) throw new ApiError(404, 'Employee not found.');
  if (!Number.isFinite(employee.basicSalary) || employee.basicSalary <= 0) {
    throw new ApiError(409, 'Set this employee’s basic salary before generating a salary draft.');
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const rule = await PayrollRule.findOne({ effectiveAt: { $lte: monthStart } })
    .sort({ effectiveAt: -1, version: -1 });
  if (!rule) {
    throw new ApiError(409, 'No salary rule is effective for this month. Create and save a Salary Rules version first.');
  }

  const monthlyAttendance = await AttendanceMonth.findOne({ employee: employeeId, month, year });
  if (!monthlyAttendance) {
    throw new ApiError(409, 'No imported monthly attendance exists for this employee and month. Import and confirm the PDF first.');
  }

  const sourceImport = await AttendanceImport.findById(monthlyAttendance.sourceImport)
    .select('records status fileName reportMonthLabel');
  if (!sourceImport || sourceImport.status !== 'imported') {
    throw new ApiError(409, 'The source attendance import is not confirmed. Confirm it before generating salary.');
  }
  const sourceRow = sourceImport.records.find((record) => String(record.employee) === String(employeeId));
  if (!sourceRow) throw new ApiError(409, 'Could not find this employee in the confirmed source PDF.');
  if (sourceRow.errors?.length) {
    throw new ApiError(409, 'Attendance has blocking PDF validation errors; resolve them before salary generation.', sourceRow.errors);
  }

  const attendanceForCalculation = {
    ...monthlyAttendance.toObject(),
    sourceWarnings: sourceRow.warnings || [],
  };
  const calculation = calculateSalaryDraft({
    monthlyAttendance: attendanceForCalculation,
    rule,
    basicSalary: employee.basicSalary,
  });
  if (calculation.errors.length) {
    throw new ApiError(409, 'Salary draft cannot be generated until attendance or rule exceptions are resolved.', calculation.errors);
  }

  const result = calculation.result;
  const payroll = await Payroll.create({
    employee: employee._id,
    month,
    year,
    basicSalary: result.basicSalary,
    hra: result.components.filter((component) => component.type === 'earning' && component.name.toLowerCase() === 'hra').reduce((sum, component) => sum + component.amount, 0),
    conveyanceAllowance: result.components.filter((component) => component.type === 'earning' && component.name.toLowerCase().includes('conveyance')).reduce((sum, component) => sum + component.amount, 0),
    medicalAllowance: result.components.filter((component) => component.type === 'earning' && component.name.toLowerCase().includes('medical')).reduce((sum, component) => sum + component.amount, 0),
    specialAllowance: result.components.filter((component) => component.type === 'earning' && component.name.toLowerCase().includes('special')).reduce((sum, component) => sum + component.amount, 0),
    overtimePay: 0,
    grossSalary: result.grossSalary,
    totalDeductions: result.totalDeductions,
    netSalary: result.netSalary,
    workingDays: result.workingDays,
    presentDays: result.presentDays,
    absentDays: result.absentDays,
    lopDays: result.lopDays,
    lopDeduction: result.lopDeduction,
    status: 'draft',
    reviewStatus: 'pending',
    processedBy: req.user._id,
    processedAt: new Date(),
    payrollRuleVersion: rule.version,
    sourceAttendanceMonth: monthlyAttendance._id,
    calculationSnapshot: {
      rules: rule.toObject(),
      attendance: {
        importId: sourceImport._id,
        fileName: sourceImport.fileName,
        reportMonthLabel: sourceImport.reportMonthLabel,
        sourceSummary: monthlyAttendance.sourceSummary,
        days: monthlyAttendance.days,
      },
      result,
      warnings: calculation.warnings,
    },
  });

  await payroll.populate('employee', 'firstName lastName employeeId designation');
  return res.status(201).json(
    new ApiResponse(201, payroll, 'Salary draft generated from imported attendance and saved for Admin review; it is not finalized or paid.'),
  );
});

// PATCH /api/v1/payroll/:id/review — Admin approval finalizes a salary draft
export const reviewPayroll = asyncHandler(async (req, res) => {
  const { approve, comment = '' } = req.body;
  if (approve !== true) throw new ApiError(400, 'Explicitly approve the salary draft to finalize it.');
  const payroll = await Payroll.findOneAndUpdate(
    { _id: req.params.id, status: 'draft', reviewStatus: 'pending', finalizedAt: null },
    {
      $set: {
        status: 'processed',
        reviewStatus: 'approved',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewComment: String(comment).trim(),
        finalizedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  ).populate('employee', 'firstName lastName employeeId designation');
  if (!payroll) throw new ApiError(404, 'Pending salary draft not found; it may already be reviewed.');
  return res.status(200).json(new ApiResponse(200, payroll, 'Salary reviewed and finalized.'));
});

// GET /api/v1/payroll/my — Employee sees own payslips
export const getMyPayroll = asyncHandler(async (req, res) => {
  const payrolls = await Payroll.find({
    employee: req.user._id,
    finalizedAt: { $ne: null },
  })
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
  if (req.user.role === 'hr') filter.finalizedAt = { $ne: null };

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
  const payroll = await Payroll.findOneAndUpdate(
    {
      _id: req.params.id,
      status: 'processed',
      $or: [
        { finalizedAt: { $ne: null } },
        { calculationSnapshot: { $exists: false } },
      ],
    },
    { $set: { status: 'paid', paidAt: new Date() } },
    { new: true }
  );

  if (!payroll) throw new ApiError(409, 'Only an Admin-reviewed and finalized salary can be marked paid.');

  return res.status(200).json(
    new ApiResponse(200, payroll, 'Payroll marked as paid')
  );
});