import Task from '../models/Task.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getTasks = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'employee') {
    filter.assignedTo = req.user._id;
  } else if (req.user.role === 'manager') {
    filter.$or = [
      { assignedTo: req.user._id },
      { assignedBy: req.user._id },
    ];
  }

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
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  ).populate('assignedTo', 'firstName lastName');

  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json(new ApiResponse(200, task, 'Task updated'));
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status,
        completedAt: status === 'done' ? new Date() : null,
      }
    },
    { new: true }
  );

  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json(new ApiResponse(200, task, 'Status updated'));
});

export const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        comments: { user: req.user._id, text: req.body.text }
      }
    },
    { new: true }
  ).populate('comments.user', 'firstName lastName');

  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json(new ApiResponse(200, task, 'Comment added'));
});

export const deleteTask = asyncHandler(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Task deleted'));
});