import Department from '../models/Department.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ status: 'active' })
    .populate('head', 'firstName lastName designation');

  // Add employee count to each department
  const deptWithCount = await Promise.all(
    departments.map(async (dept) => {
      const count = await User.countDocuments({
        department: dept._id, status: 'active'
      });
      return { ...dept.toObject(), employeeCount: count };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, deptWithCount, 'Departments fetched')
  );
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, head, budget } = req.body;

  const existing = await Department.findOne({
    $or: [{ name }, { code: code?.toUpperCase() }]
  });
  if (existing) {
    throw new ApiError(409, 'Department with this name or code already exists');
  }

  const department = await Department.create({
    name, code, description, head, budget,
  });

  return res.status(201).json(
    new ApiResponse(201, department, 'Department created successfully')
  );
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('head', 'firstName lastName');

  if (!department) throw new ApiError(404, 'Department not found');

  return res.status(200).json(
    new ApiResponse(200, department, 'Department updated')
  );
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const empCount = await User.countDocuments({
    department: req.params.id, status: 'active'
  });

  if (empCount > 0) {
    throw new ApiError(400, `Cannot delete department with ${empCount} active employees`);
  }

  await Department.findByIdAndUpdate(req.params.id, { status: 'inactive' });

  return res.status(200).json(
    new ApiResponse(200, {}, 'Department deactivated')
  );
});