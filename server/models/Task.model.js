import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const TaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in-progress', 'in-review', 'done', 'blocked', 'cancelled'], default: 'todo' },
  dueDate: Date,
  completedAt: Date,
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  attachments: [String],
  tags: [String],
  estimatedHours: Number,
  actualHours: Number,
}, { timestamps: true });

const Task = model('Task', TaskSchema);
export default Task;