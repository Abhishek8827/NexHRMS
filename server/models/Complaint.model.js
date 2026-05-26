import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ComplaintSchema = new Schema({
  raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  against: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  category: { type: String, enum: ['harassment', 'discrimination', 'workplace-safety', 'payroll', 'policy-violation', 'manager-behavior', 'other'], required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'under-review', 'action-taken', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  resolution: String,
  resolvedAt: Date,
  attachments: [String],
}, { timestamps: true });

const Complaint = model('Complaint', ComplaintSchema);
export default Complaint;