import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const dailyEntrySchema = new Schema({
  day: { type: Number, required: true, min: 1, max: 31 },
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

const parsedRecordSchema = new Schema({
  pageNumber: { type: Number, required: true },
  sectionNumber: { type: Number, required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  matchedEmployeeName: { type: String, default: '' },
  matchedEmployeeId: { type: String, default: '' },
  matchedDepartment: { type: String, default: '' },
  employeeCode: { type: String, default: '', trim: true },
  employeeName: { type: String, default: '' },
  department: { type: String, default: '' },
  summary: {
    present: { type: Number, default: null },
    weeklyOff: { type: Number, default: null },
    holiday: { type: Number, default: null },
    leave: { type: Number, default: null },
    absent: { type: Number, default: null },
    workPlusOvertimeMinutes: { type: Number, default: null },
    overtimeMinutes: { type: Number, default: null },
  },
  days: [dailyEntrySchema],
  errors: [{ type: String }],
  warnings: [{ type: String }],
}, { _id: false });

const AttendanceImportSchema = new Schema({
  fileName: { type: String, required: true },
  fileHash: { type: String, required: true, index: true },
  sourcePdf: { type: Buffer, required: true, select: false },
  reportMonthLabel: { type: String, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  pageCount: { type: Number, required: true },
  records: [parsedRecordSchema],
  missingEmployeeCodes: [{ type: String }],
  status: {
    type: String,
    enum: ['previewed', 'imported'],
    default: 'previewed',
  },
  importedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  confirmedAt: { type: Date, default: null },
  importedRecordCount: { type: Number, default: 0 },
}, { timestamps: true });

AttendanceImportSchema.index({ month: 1, year: 1, status: 1 });

const AttendanceImport = model('AttendanceImport', AttendanceImportSchema);
export default AttendanceImport;
