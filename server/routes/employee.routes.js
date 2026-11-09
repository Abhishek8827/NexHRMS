import { Router } from 'express';
import {
  getAllEmployees, getEmployeeById, updateOwnProfile,
  updateEmployee, deactivateEmployee,
} from '../controllers/employee.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.put('/me', updateOwnProfile);
router.get('/', authorize('admin', 'hr'), getAllEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', authorize('admin', 'hr'), updateEmployee);
router.delete('/:id', authorize('admin'), deactivateEmployee);

export default router;