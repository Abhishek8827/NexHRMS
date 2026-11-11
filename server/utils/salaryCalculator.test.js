import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSalaryDraft } from './salaryCalculator.js';

const baseRule = ({ workingDays = [1], holidays = [], leaveTreatment = 'manual-review' } = {}) => ({
  attendance: {
    workingDays,
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    standardHours: 8,
    gracePeriodMinutes: 15,
    halfDayThresholdPercent: 50,
    lateComingBands: [
      { minimum: 2, maximum: 4, lopDays: 0.5 },
      { minimum: 5, maximum: 7, lopDays: 1 },
      { minimum: 8, maximum: 10, lopDays: 1.5 },
      { minimum: 11, maximum: 13, lopDays: 2 },
    ],
    maxAutomaticLateMarks: 13,
  },
  salary: {
    absentLopDays: 1,
    halfDayLopDays: 0.5,
    unpaidLeaveLopDays: 1,
    leaveTreatment,
    components: [],
  },
  holidays,
});

const jan2026Attendance = (overrides = {}) => {
  const days = [];
  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(Date.UTC(2026, 0, day));
    const isMonday = date.getUTCDay() === 1;
    days.push({ day, status: isMonday ? 'present' : 'weekly-off', inTime: isMonday ? '09:00' : null, overtimeMinutes: 0, ...overrides[day] });
  }
  return { month: 1, year: 2026, days, sourceWarnings: [] };
};

test('prorates basic salary across scheduled days and treats configured paid holiday as paid', () => {
  const attendance = jan2026Attendance({
    5: { status: 'holiday' },
    12: { status: 'absent', inTime: null },
    19: { status: 'late', inTime: '09:20' },
  });
  const rule = baseRule({ holidays: [{ date: new Date('2026-01-05T00:00:00.000Z'), name: 'Configured day', paid: true }] });
  const result = calculateSalaryDraft({ monthlyAttendance: attendance, rule, basicSalary: 20000 });
  assert.deepEqual(result.errors, []);
  assert.equal(result.result.workingDays, 3);
  assert.equal(result.result.absentDays, 1);
  assert.equal(result.result.lateComingCount, 1);
  assert.equal(result.result.lopDays, 1);
  assert.equal(result.result.lopDeduction, 6667);
  assert.equal(result.result.netSalary, 13333);
});

test('confirmed late-coming bands add LOP and excessive counts require manual review', () => {
  const attendance = jan2026Attendance({
    5: { status: 'late', inTime: '09:20' },
    12: { status: 'late', inTime: '09:20' },
  });
  const result = calculateSalaryDraft({ monthlyAttendance: attendance, rule: baseRule(), basicSalary: 20000 });
  assert.deepEqual(result.errors, []);
  assert.equal(result.result.lateComingCount, 2);
  assert.equal(result.result.lateLopDays, 0.5);

  const manyLate = jan2026Attendance();
  for (const day of manyLate.days) {
    day.status = 'late';
    day.inTime = '09:30';
  }
  const highCountRule = baseRule({ workingDays: [0, 1, 2, 3, 4, 5, 6] });
  const highCount = calculateSalaryDraft({ monthlyAttendance: manyLate, rule: highCountRule, basicSalary: 20000 });
  assert.ok(highCount.errors.some((message) => message.includes('manual rule review')));
});

test('does not infer absence from missing statuses and blocks unresolved leave treatment', () => {
  const missing = jan2026Attendance({ 12: { status: null } });
  const missingResult = calculateSalaryDraft({ monthlyAttendance: missing, rule: baseRule(), basicSalary: 20000 });
  assert.ok(missingResult.errors.some((message) => message.includes('no usable status')));

  const leave = jan2026Attendance({ 12: { status: 'on-leave' } });
  const leaveResult = calculateSalaryDraft({ monthlyAttendance: leave, rule: baseRule(), basicSalary: 20000 });
  assert.ok(leaveResult.errors.some((message) => message.includes('LV/on-leave')));
});

test('records overtime for review but never adds overtime pay', () => {
  const attendance = jan2026Attendance({ 12: { status: 'present', overtimeMinutes: 120 } });
  const result = calculateSalaryDraft({ monthlyAttendance: attendance, rule: baseRule(), basicSalary: 20000 });
  assert.deepEqual(result.errors, []);
  assert.equal(result.result.overtimeMinutes, 120);
  assert.equal(result.result.overtimePay, 0);
  assert.ok(result.warnings.some((message) => message.includes('overtime pay is disabled')));
});
