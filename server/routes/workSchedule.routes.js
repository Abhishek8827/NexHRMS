import { Router } from 'express';
import {
  getAllSchedules, getEmployeeSchedule,
  createSchedule, updateSchedule, deleteSchedule,
} from '../controllers/workSchedule.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', authorize('admin', 'hr'), getAllSchedules);
router.get('/employee/:empId', getEmployeeSchedule);
router.get('/my', (req, res, next) => {
  req.params.empId = req.user._id.toString();
  next();
}, getEmployeeSchedule);
router.post('/', authorize('admin', 'hr'), createSchedule);
router.put('/:id', authorize('admin', 'hr'), updateSchedule);
router.delete('/:id', authorize('admin', 'hr'), deleteSchedule);

export default router;