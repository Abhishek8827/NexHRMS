import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const PayrollSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  conveyanceAllowance: { type: Number, default: 0 },
  medicalAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  arrears: { type: Number, default: 0 },
  epfEmployee: { type: Number, default: 0 },
  epfEmployer: { type: Number, default: 0 },
  esicEmployee: { type: Number, default: 0 },
  esicEmployer: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  loanDeduction: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  lopDeduction: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  workingDays: { type: Number },
  presentDays: { type: Number },
  absentDays: { type: Number },
  lopDays: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'processed', 'paid'],
    default: 'draft',
  },
  payslipUrl: { type: String, default: null },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date },
}, { timestamps: true });

PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = model('Payroll', PayrollSchema);
export default Payroll;