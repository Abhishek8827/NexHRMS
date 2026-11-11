import PayrollRule from '../models/PayrollRule.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const normalizeRules = (payload = {}) => ({
  attendance: {
    workingDays: payload.attendance?.workingDays,
    shiftStartTime: payload.attendance?.shiftStartTime,
    shiftEndTime: payload.attendance?.shiftEndTime,
    standardHours: payload.attendance?.standardHours,
    gracePeriodMinutes: payload.attendance?.gracePeriodMinutes,
    halfDayThresholdPercent: payload.attendance?.halfDayThresholdPercent,
    lateComingBands: payload.attendance?.lateComingBands,
    maxAutomaticLateMarks: 13,
  },
  salary: {
    basis: 'scheduled-workdays',
    absentLopDays: payload.salary?.absentLopDays,
    halfDayLopDays: payload.salary?.halfDayLopDays,
    unpaidLeaveLopDays: payload.salary?.unpaidLeaveLopDays,
    leaveTreatment: payload.salary?.leaveTreatment,
    // OT is recorded for review but is not paid automatically per the Admin's instruction.
    overtimePayEnabled: false,
    components: payload.salary?.components || [],
  },
  holidays: payload.holidays || [],
});

const validateRulePayload = ({ effectiveMonth, effectiveYear, attendance, salary, holidays }) => {
  if (!attendance || !salary) throw new ApiError(400, 'Attendance and salary rule sections are required.');
  if (!Number.isInteger(Number(effectiveMonth)) || Number(effectiveMonth) < 1 || Number(effectiveMonth) > 12) {
    throw new ApiError(400, 'Select a valid effective month.');
  }
  if (!Number.isInteger(Number(effectiveYear)) || Number(effectiveYear) < 2000 || Number(effectiveYear) > 2200) {
    throw new ApiError(400, 'Select a valid effective year.');
  }
  if (!Array.isArray(attendance.workingDays) || attendance.workingDays.length === 0
      || attendance.workingDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
      || new Set(attendance.workingDays).size !== attendance.workingDays.length) {
    throw new ApiError(400, 'Select one or more unique working weekdays (Sunday=0 through Saturday=6).');
  }
  if (!Array.isArray(attendance.lateComingBands)) {
    throw new ApiError(400, 'Late-coming bands must be a list.');
  }
  const bands = [...attendance.lateComingBands].sort((a, b) => a.minimum - b.minimum);
  let lastMaximum = 0;
  for (const band of bands) {
    if (!Number.isInteger(band.minimum) || !Number.isInteger(band.maximum)
        || band.minimum < 1 || band.maximum > 13 || band.maximum < band.minimum
        || band.minimum <= lastMaximum || !Number.isFinite(band.lopDays) || band.lopDays < 0) {
      throw new ApiError(400, 'Late bands must be non-overlapping integer ranges within 1–13 with non-negative LOP days.');
    }
    lastMaximum = band.maximum;
  }
  if (!['paid', 'unpaid', 'manual-review'].includes(salary.leaveTreatment)) {
    throw new ApiError(400, 'Choose how leave is treated: paid, unpaid, or manual review.');
  }
  for (const [name, value] of Object.entries({
    absence: salary.absentLopDays,
    halfDay: salary.halfDayLopDays,
    unpaidLeave: salary.unpaidLeaveLopDays,
  })) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new ApiError(400, `Enter an explicit ${name} LOP weight between 0 and 1.`);
    }
  }
  const holidayDates = new Set();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    if (!holiday.name?.trim() || Number.isNaN(date.getTime())) {
      throw new ApiError(400, 'Each holiday needs a valid date and a name.');
    }
    const dateKey = date.toISOString().slice(0, 10);
    if (holidayDates.has(dateKey)) throw new ApiError(400, `Duplicate holiday date: ${dateKey}.`);
    holidayDates.add(dateKey);
  }
  for (const component of salary.components || []) {
    if (!component.name?.trim() || !['earning', 'deduction'].includes(component.type)
        || !['fixed', 'percent-of-basic'].includes(component.method)
        || !Number.isFinite(component.value) || component.value < 0) {
      throw new ApiError(400, 'Every salary component needs a name, type, calculation method, and non-negative value.');
    }
  }
};

export const getPayrollRules = asyncHandler(async (_req, res) => {
  const rules = await PayrollRule.find()
    .populate('createdBy', 'firstName lastName')
    .sort({ effectiveYear: -1, effectiveMonth: -1, version: -1 });
  return res.status(200).json(new ApiResponse(200, rules, 'Payroll rules fetched.'));
});

export const createPayrollRule = asyncHandler(async (req, res) => {
  const normalized = normalizeRules(req.body);
  validateRulePayload({ ...req.body, ...normalized });

  const effectiveMonth = Number(req.body.effectiveMonth);
  const effectiveYear = Number(req.body.effectiveYear);
  const latest = await PayrollRule.findOne().sort({ version: -1 }).select('version');
  const version = (latest?.version || 0) + 1;
  const effectiveAt = new Date(Date.UTC(effectiveYear, effectiveMonth - 1, 1));

  const rule = await PayrollRule.create({
    version,
    effectiveMonth,
    effectiveYear,
    effectiveAt,
    ...normalized,
    notes: req.body.notes || '',
    createdBy: req.user._id,
  });
  await PayrollRule.updateMany(
    { _id: { $ne: rule._id }, status: 'active' },
    { $set: { status: 'superseded' } },
  );

  const populated = await PayrollRule.findById(rule._id).populate('createdBy', 'firstName lastName');
  return res.status(201).json(new ApiResponse(201, populated, `Payroll rule version ${version} created.`));
});
