import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const PerformanceReviewSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  quarter: { type: Number, enum: [1, 2, 3, 4], required: true },
  year: { type: Number, required: true },
  goals: [{
    title: String, target: String, achieved: String,
    score: { type: Number, min: 1, max: 5 }, weight: { type: Number, default: 20 },
  }],
  competencies: [{
    name: String, score: { type: Number, min: 1, max: 5 }, comments: String,
  }],
  selfRating: { type: Number, min: 1, max: 5 },
  selfComments: String,
  managerRating: { type: Number, min: 1, max: 5 },
  managerComments: String,
  overallScore: { type: Number, min: 1, max: 5 },
  grade: { type: String, enum: ['excellent', 'good', 'average', 'needs-improvement', 'unsatisfactory'] },
  status: { type: String, enum: ['draft', 'self-review', 'manager-review', 'acknowledged', 'completed'], default: 'draft' },
  nextPeriodGoals: [String],
  acknowledgedAt: Date,
}, { timestamps: true });

const PerformanceReview = model('PerformanceReview', PerformanceReviewSchema);
export default PerformanceReview;