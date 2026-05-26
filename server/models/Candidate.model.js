import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const CandidateSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: String,
  resumeUrl: { type: String, required: true },
  coverLetter: String,
  source: { type: String, enum: ['job-portal', 'linkedin', 'referral', 'direct-application', 'other'], default: 'direct-application' },
  stage: { type: String, enum: ['applied', 'screening', 'technical-round', 'hr-round', 'final-round', 'offer', 'hired', 'rejected', 'withdrawn'], default: 'applied' },
  interviews: [{
    round: Number,
    type: { type: String, enum: ['phone', 'video', 'in-person', 'technical', 'hr'] },
    scheduledAt: Date,
    interviewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    result: { type: String, enum: ['pass', 'fail', 'hold', 'no-show'] },
    feedback: String,
    rating: { type: Number, min: 1, max: 5 },
  }],
  offerLetterUrl: String,
  offeredSalary: Number,
  offerStatus: { type: String, enum: ['not-sent', 'sent', 'accepted', 'declined', 'negotiating'], default: 'not-sent' },
  convertedToEmployee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  rating: { type: Number, min: 1, max: 5 },
  notes: String,
}, { timestamps: true });

const Candidate = model('Candidate', CandidateSchema);
export default Candidate;