import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const EmployeeImportRowSchema = new Schema({
  rowNumber: { type: Number, required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  employeeLabel: { type: String, default: '' },
  identifier: { type: String, default: '' },
  before: { type: Schema.Types.Mixed, default: {} },
  changes: { type: Schema.Types.Mixed, default: {} },
  diff: [{
    field: { type: String, required: true },
    label: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  }],
  errors: [{ type: String }],
  warnings: [{ type: String }],
}, { _id: false });

const EmployeeImportSchema = new Schema({
  fileName: { type: String, required: true },
  fileHash: { type: String, required: true, index: true },
  sourceFile: { type: Buffer, select: false },
  status: { type: String, enum: ['previewed', 'imported'], default: 'previewed', index: true },
  records: [EmployeeImportRowSchema],
  importedRecordCount: { type: Number, default: 0 },
  importedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  confirmedAt: { type: Date, default: null },
}, { timestamps: true });

export default model('EmployeeImport', EmployeeImportSchema);
