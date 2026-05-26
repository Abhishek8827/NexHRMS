import { Router } from 'express';
import {
  getAllDepartments, createDepartment,
  updateDepartment, deleteDepartment,
} from '../controllers/department.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getAllDepartments);
router.post('/', authorize('admin', 'hr'), createDepartment);
router.put('/:id', authorize('admin', 'hr'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

export default router;