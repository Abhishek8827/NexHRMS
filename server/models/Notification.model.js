import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const NotificationSchema = new Schema({
  recipients: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  // If empty — broadcast to all matching roles
  recipientRoles: [{
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
  }],
  type: {
    type: String,
    enum: [
      'leave_applied', 'leave_approved', 'leave_rejected',
      'job_posted', 'complaint_raised', 'complaint_resolved',
      'task_assigned', 'payroll_processed', 'attendance_correction',
      'general',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },          // Frontend route to redirect
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  data: { type: Schema.Types.Mixed },  // Extra payload
}, { timestamps: true });

NotificationSchema.index({ recipients: 1 });
NotificationSchema.index({ recipientRoles: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification = model('Notification', NotificationSchema);
export default Notification;