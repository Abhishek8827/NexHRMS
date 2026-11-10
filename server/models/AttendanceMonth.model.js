import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const dailyRecordSchema = new Schema({
  day: { type: Number, required: true, min: 1, max: 31 },
  date: { type: Date, required: true },
  rawStatus: { type: String, default: null },
  status: {
    type: String,
    enum: ['present', 'absent', 'weekly-off', 'holiday', 'on-leave', 'half-day', null],
    default: null,
  },
  inTime: { type: String, default: null },
  outTime: { type: String, default: null },
  workMinutes: { type: Number, default: null },
  breakMinutes: { type: Number, default: null },
  overtimeMinutes: { type: Number, default: null },
}, { _id: false });

const AttendanceMonthSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  employeeCode: { type: String, required: true },
  employeeIdSnapshot: { type: String, required: true },
  employeeNameSnapshot: { type: String, required: true },
  departmentSnapshot: { type: String, default: '' },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  sourceImport: { type: Schema.Types.ObjectId, ref: 'AttendanceImport', required: true },
  sourceSummary: {
    present: { type: Number, default: null },
    weeklyOff: { type: Number, default: null },
    holiday: { type: Number, default: null },
    leave: { type: Number, default: null },
    absent: { type: Number, default: null },
    workPlusOvertimeMinutes: { type: Number, default: null },
    overtimeMinutes: { type: Number, default: null },
  },
  days: [dailyRecordSchema],
  calculationRulesVersion: { type: String, default: null },
  calculationSnapshot: { type: Schema.Types.Mixed, default: null },
  reviewStatus: {
    type: String,
    enum: ['pending', 'reviewed'],
    default: 'pending',
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  finalizedAt: { type: Date, default: null },
  finalizedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  revisionHistory: [{
    revisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revisedAt: { type: Date, default: Date.now },
    reason: { type: String, required: true, trim: true },
    previousSnapshot: { type: Schema.Types.Mixed, required: true },
    updatedSnapshot: { type: Schema.Types.Mixed, required: true },
  }],
}, { timestamps: true });

AttendanceMonthSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
AttendanceMonthSchema.index({ month: 1, year: 1, reviewStatus: 1, finalizedAt: 1 });

const AttendanceMonth = model('AttendanceMonth', AttendanceMonthSchema);
export default AttendanceMonth;
