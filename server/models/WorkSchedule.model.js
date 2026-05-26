import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const WorkScheduleSchema = new Schema({
  // Can be assigned to a specific employee OR a department
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },

  // Shift name — e.g. "General Shift", "Night Shift"
  shiftName: {
    type: String,
    required: true,
    default: 'General Shift',
  },

  // Working days — array of 0(Sun)–6(Sat)
  workingDays: {
    type: [Number],
    default: [1, 2, 3, 4, 5],   // Mon–Fri by default
  },

  // Punch-in window
  punchInTime: {
    hour: { type: Number, default: 9 },     // 9 AM
    minute: { type: Number, default: 0 },
  },

  // Grace period — minutes allowed after punchInTime before marking late
  gracePeriodMinutes: {
    type: Number,
    default: 15,
  },

  // Standard punch-out time (for overtime calculation)
  punchOutTime: {
    hour: { type: Number, default: 18 },    // 6 PM
    minute: { type: Number, default: 0 },
  },

  // Standard working hours per day
  standardHours: {
    type: Number,
    default: 8,
  },

  // Is this the default/fallback schedule?
  isDefault: {
    type: Boolean,
    default: false,
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

const WorkSchedule = model('WorkSchedule', WorkScheduleSchema);
export default WorkSchedule;