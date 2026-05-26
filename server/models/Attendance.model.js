import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const AttendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  punchIn: { type: Date, default: null },
  punchOut: { type: Date, default: null },
  workingMinutes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'holiday', 'on-leave'],
    default: 'absent',
  },
  isLate: { type: Boolean, default: false },
  lateByMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },
  workMode: { type: String, enum: ['office', 'remote'], default: 'office' },
  remarks: { type: String, default: '' },
  isManualEntry: { type: Boolean, default: false },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = model('Attendance', AttendanceSchema);
export default Attendance;