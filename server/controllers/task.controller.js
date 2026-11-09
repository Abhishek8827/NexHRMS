import Task from '../models/Task.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const canManageTasks = (user) => ['admin', 'hr'].includes(user.role);

const isTaskParticipant = (task, userId) => {
  const userIdString = userId.toString();
  return task.assignedBy.toString() === userIdString
    || (task.assignedTo || []).some((assignee) => assignee.toString() === userIdString);
};

export const getTasks = asyncHandler(async (req, res) => {
  const filter = canManageTasks(req.user)
    ? {}
    : { assignedTo: req.user._id };

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'firstName lastName avatar')
    .populate('assignedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, tasks, 'Tasks fetched'));
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ...req.body,
    assignedBy: req.user._id,
  });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'firstName lastName')
    .populate('assignedBy', 'firstName lastName');

  return res.status(201).json(new ApiResponse(201, populated, 'Task created'));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  if (!canManageTasks(req.user) && task.assignedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot edit this task');
  }

  const editableFields = [
    'title', 'description', 'assignedTo', 'project', 'priority', 'status',
    'dueDate', 'attachments', 'tags', 'estimatedHours', 'actualHours',
  ];
  for (const field of editableFields) {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  }

  await task.save();
  await task.populate('assignedTo', 'firstName lastName');

  return res.status(200).json(new ApiResponse(200, task, 'Task updated'));
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['todo', 'in-progress', 'in-review', 'done', 'blocked', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, 'Choose a valid task status');
  }

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  const isAssignee = (task.assignedTo || []).some(
    (assignee) => assignee.toString() === req.user._id.toString(),
  );
  if (!canManageTasks(req.user) && !isAssignee) {
    throw new ApiError(403, 'You cannot update this task');
  }

  task.status = status;
  task.completedAt = status === 'done' ? new Date() : null;
  await task.save();

  return res.status(200).json(new ApiResponse(200, task, 'Status updated'));
});

export const addComment = asyncHandler(async (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text) throw new ApiError(400, 'Comment text is required');

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  if (!canManageTasks(req.user) && !isTaskParticipant(task, req.user._id)) {
    throw new ApiError(403, 'You cannot comment on this task');
  }

  task.comments.push({ user: req.user._id, text });
  await task.save();
  await task.populate('comments.user', 'firstName lastName');

  return res.status(200).json(new ApiResponse(200, task, 'Comment added'));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json(new ApiResponse(200, {}, 'Task deleted'));
});
