import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const LeaveSchema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'maternity', 'paternity', 'loss-of-pay'],
    required: true,
  },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  numberOfDays: { type: Number },

  // ── FIX: These fields were missing ──────────────────────
  isHalfDay: { type: Boolean, default: false },
  halfDayType: {
    type: String,
    enum: ['first-half', 'second-half', null],
    default: null,
  },
  // ────────────────────────────────────────────────────────

  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  actionBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  actionDate: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },
  attachments: [{ type: String }],
}, { timestamps: true });

const Leave = model('Leave', LeaveSchema);
export default Leave;