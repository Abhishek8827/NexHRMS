import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  employeeId: { type: String, unique: true, sparse: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
    default: 'employee',
  },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: String, trim: true },
  manager: { type: Schema.Types.ObjectId, ref: 'User' },
  joiningDate: { type: Date },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
  },
  avatar: { type: String, default: null },
  status: {
    type: String,
  enum: ['active', 'inactive', 'terminated', 'on-notice'],
    default: 'active',
  },
  basicSalary: { type: Number, default: 0 },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  refreshToken: { type: String, select: false },
  lastLogin: { type: Date },
}, { timestamps: true });

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// UserSchema.index({ email: 1 });
// UserSchema.index({ employeeId: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ manager: 1 });

const User = model('User', UserSchema);
export default User;