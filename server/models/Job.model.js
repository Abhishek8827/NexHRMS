import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const JobSchema = new Schema({
  title: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  location: { type: String, default: 'Remote' },
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
  experience: { min: { type: Number, default: 0 }, max: { type: Number, default: 10 } },
  salary: { min: Number, max: Number, currency: { type: String, default: 'INR' }, isDisclosed: { type: Boolean, default: false } },
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  skills: [String],
  openings: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'open', 'closed', 'on-hold'], default: 'draft' },
  applicationDeadline: Date,
  postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  applicationCount: { type: Number, default: 0 },
}, { timestamps: true });

const Job = model('Job', JobSchema);
export default Job;