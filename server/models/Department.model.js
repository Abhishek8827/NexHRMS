import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const DepartmentSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  head: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  budget: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

const Department = model('Department', DepartmentSchema);
export default Department;