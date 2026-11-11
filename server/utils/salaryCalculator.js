const toMinuteOfDay = (value) => {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

export const calculateSalaryDraft = ({ monthlyAttendance, rule, basicSalary }) => {
  const errors = [];
  const warnings = [];
  const year = monthlyAttendance.year;
  const month = monthlyAttendance.month;
  if (!Number.isFinite(basicSalary) || basicSalary <= 0) errors.push('Employee basic salary must be greater than zero.');

  const { attendance: attendanceRule, salary: salaryRule } = rule;
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysByNumber = new Map((monthlyAttendance.days || []).map((day) => [day.day, day]));
  const holidayByDate = new Map((rule.holidays || []).map((holiday) => [dateKey(holiday.date), holiday]));
  const startMinute = toMinuteOfDay(attendanceRule.shiftStartTime);
  if (startMinute === null) errors.push('Configured shift start time is invalid.');

  const scheduledDayNumbers = [];
  for (let day = 1; day <= dayCount; day += 1) {
    const calendarDate = new Date(Date.UTC(year, month - 1, day));
    if (!attendanceRule.workingDays.includes(calendarDate.getUTCDay())) continue;
    const holiday = holidayByDate.get(dateKey(calendarDate));
    if (holiday?.paid) continue;
    scheduledDayNumbers.push(day);
  }

  if (scheduledDayNumbers.length === 0) errors.push('No scheduled working days found for the month under this rule version.');

  let absentDays = 0;
  let halfDays = 0;
  let unpaidLeaveDays = 0;
  let lateComingCount = 0;
  let overtimeMinutes = 0;
  let attendedDays = 0;

  for (const dayNumber of scheduledDayNumbers) {
    const day = daysByNumber.get(dayNumber);
    const calendarDate = new Date(Date.UTC(year, month - 1, dayNumber));
    const date = dateKey(calendarDate);
    const holiday = holidayByDate.get(date);
    if (!day || !day.status) {
      errors.push(`Day ${dayNumber} has no usable status; resolve it before salary generation.`);
      continue;
    }

    if (day.status === 'weekly-off') {
      errors.push(`Day ${dayNumber} is marked weekly-off but is a scheduled workday. Fix the schedule or attendance record.`);
      continue;
    }
    if (day.status === 'holiday' && !holiday) {
      errors.push(`Day ${dayNumber} is marked holiday but is not in the configured holiday calendar.`);
      continue;
    }

    overtimeMinutes += Number(day.overtimeMinutes) || 0;
    if (holiday?.paid) continue;

    if (day.status === 'absent') {
      absentDays += 1;
    } else if (day.status === 'half-day') {
      halfDays += 1;
      attendedDays += 0.5;
    } else if (day.status === 'on-leave') {
      if (salaryRule.leaveTreatment === 'manual-review') {
        errors.push(`Day ${dayNumber} is LV/on-leave but the rule requires Admin to configure paid or unpaid leave treatment.`);
      } else if (salaryRule.leaveTreatment === 'unpaid') {
        unpaidLeaveDays += 1;
      } else {
        attendedDays += 1;
      }
    } else if (day.status === 'holiday') {
      // An explicitly configured unpaid holiday remains a scheduled, unpaid day.
      absentDays += 1;
    } else if (day.status === 'present' || day.status === 'late') {
      attendedDays += 1;
    } else {
      errors.push(`Day ${dayNumber} has unsupported status “${day.status}”.`);
      continue;
    }

    const inMinute = toMinuteOfDay(day.inTime);
    const statusIsAttendance = ['present', 'late', 'half-day'].includes(day.status);
    if (day.status === 'late' || (statusIsAttendance && inMinute !== null
      && inMinute > startMinute + attendanceRule.gracePeriodMinutes)) {
      lateComingCount += 1;
    }
  }

  // Track OT across all valid calendar days for the review snapshot; salary OT is deliberately zero.
  overtimeMinutes = (monthlyAttendance.days || []).reduce((total, day) => total + (Number(day.overtimeMinutes) || 0), 0);
  if (lateComingCount > attendanceRule.maxAutomaticLateMarks) {
    errors.push(`${lateComingCount} late marks exceed the automatic policy limit of ${attendanceRule.maxAutomaticLateMarks}; manual rule review is required.`);
  }

  const lateBand = (attendanceRule.lateComingBands || []).find(
    (band) => lateComingCount >= band.minimum && lateComingCount <= band.maximum,
  );
  if (lateComingCount > 0 && lateComingCount <= attendanceRule.maxAutomaticLateMarks && lateComingCount > 1 && !lateBand) {
    errors.push(`${lateComingCount} late marks do not match a configured conversion band.`);
  }
  const lateLopDays = lateBand?.lopDays || 0;
  const absentLopDays = absentDays * salaryRule.absentLopDays;
  const halfDayLopDays = halfDays * salaryRule.halfDayLopDays;
  const leaveLopDays = unpaidLeaveDays * salaryRule.unpaidLeaveLopDays;
  const lopDays = absentLopDays + halfDayLopDays + leaveLopDays + lateLopDays;

  const holidayDayNumbers = new Set((rule.holidays || []).map((holiday) => {
    const date = new Date(holiday.date);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return null;
    return date.getUTCDate();
  }).filter(Boolean));
  for (const holidayDay of holidayDayNumbers) {
    if (!daysByNumber.has(holidayDay)) warnings.push(`Configured holiday on day ${holidayDay} is not represented in the imported daily rows.`);
  }

  const sourceWarnings = monthlyAttendance.sourceWarnings || [];
  warnings.push(...sourceWarnings);
  if (overtimeMinutes > 0) warnings.push(`${overtimeMinutes} overtime minutes are recorded; overtime pay is disabled by the current Admin instruction.`);

  if (errors.length) return { errors, warnings };

  const scheduledDays = scheduledDayNumbers.length;
  const boundedLopDays = Math.min(lopDays, scheduledDays);
  const attendancePayRatio = Math.max(0, (scheduledDays - boundedLopDays) / scheduledDays);
  const lopDeduction = basicSalary * (1 - attendancePayRatio);
  const baseAfterLop = basicSalary - lopDeduction;
  let earnings = 0;
  let componentDeductions = 0;
  const components = (salaryRule.components || []).map((component) => {
    const unproratedAmount = component.method === 'percent-of-basic'
      ? basicSalary * Number(component.value) / 100
      : Number(component.value);
    const amount = Math.round(unproratedAmount * (component.prorateWithAttendance ? attendancePayRatio : 1));
    if (component.type === 'earning') earnings += amount;
    else componentDeductions += amount;
    return { name: component.name, type: component.type, amount };
  });

  const grossSalary = Math.round(basicSalary + earnings);
  const totalDeductions = Math.round(lopDeduction + componentDeductions);
  const netSalary = Math.max(0, grossSalary - totalDeductions);
  const presentDays = Math.round(attendedDays * 100) / 100;

  return {
    errors: [],
    warnings,
    result: {
      basicSalary: Math.round(basicSalary),
      basicAfterLop: Math.round(baseAfterLop),
      earnings: Math.round(earnings),
      grossSalary,
      totalDeductions,
      netSalary,
      workingDays: scheduledDays,
      presentDays,
      absentDays,
      halfDays,
      unpaidLeaveDays,
      lateComingCount,
      lateLopDays,
      lopDays: Math.round(boundedLopDays * 100) / 100,
      lopDeduction: Math.round(lopDeduction),
      overtimeMinutes,
      overtimePay: 0,
      components,
      attendancePayRatio: Math.round(attendancePayRatio * 10000) / 10000,
    },
  };
};
