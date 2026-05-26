import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ReimbursementSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['travel', 'food', 'accommodation', 'medical', 'training', 'equipment', 'other'], required: true },
  amount: { type: Number, required: true, min: 1 },
  expenseDate: { type: Date, required: true },
  description: { type: String, required: true },
  receipts: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  approvedAmount: { type: Number, default: null },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: Date,
  remarks: String,
  paidAt: Date,
}, { timestamps: true });

const Reimbursement = model('Reimbursement', ReimbursementSchema);
export default Reimbursement;