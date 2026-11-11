import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const lateBandSchema = new Schema({
  minimum: { type: Number, required: true, min: 1, max: 13 },
  maximum: { type: Number, required: true, min: 1, max: 13 },
  lopDays: { type: Number, required: true, min: 0, max: 31 },
}, { _id: false });

const holidaySchema = new Schema({
  date: { type: Date, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  paid: { type: Boolean, required: true, default: true },
}, { _id: false });

const componentSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  type: { type: String, enum: ['earning', 'deduction'], required: true },
  method: { type: String, enum: ['fixed', 'percent-of-basic'], required: true },
  value: { type: Number, required: true, min: 0 },
  prorateWithAttendance: { type: Boolean, default: true },
}, { _id: false });

const PayrollRuleSchema = new Schema({
  version: { type: Number, required: true, unique: true, min: 1 },
  effectiveMonth: { type: Number, required: true, min: 1, max: 12 },
  effectiveYear: { type: Number, required: true, min: 2000, max: 2200 },
  effectiveAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'superseded'], default: 'active', required: true },
  attendance: {
    workingDays: { type: [Number], required: true, default: [1, 2, 3, 4, 5] },
    shiftStartTime: { type: String, required: true, default: '09:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    shiftEndTime: { type: String, required: true, default: '18:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    standardHours: { type: Number, required: true, default: 8, min: 0.25, max: 24 },
    gracePeriodMinutes: { type: Number, required: true, default: 15, min: 0, max: 180 },
    halfDayThresholdPercent: { type: Number, required: true, default: 50, min: 0, max: 100 },
    lateComingBands: { type: [lateBandSchema], default: [] },
    maxAutomaticLateMarks: { type: Number, required: true, default: 13, min: 1, max: 13 },
  },
  salary: {
    basis: { type: String, enum: ['scheduled-workdays'], required: true, default: 'scheduled-workdays' },
    absentLopDays: { type: Number, required: true, min: 0, max: 1 },
    halfDayLopDays: { type: Number, required: true, min: 0, max: 1 },
    unpaidLeaveLopDays: { type: Number, required: true, min: 0, max: 1 },
    leaveTreatment: { type: String, enum: ['paid', 'unpaid', 'manual-review'], required: true, default: 'manual-review' },
    overtimePayEnabled: { type: Boolean, required: true, default: false },
    components: { type: [componentSchema], default: [] },
  },
  holidays: { type: [holidaySchema], default: [] },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

PayrollRuleSchema.index({ effectiveYear: -1, effectiveMonth: -1, version: -1 });
PayrollRuleSchema.index({ status: 1, effectiveAt: -1 });

const PayrollRule = model('PayrollRule', PayrollRuleSchema);
export default PayrollRule;
