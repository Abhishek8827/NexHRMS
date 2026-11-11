import { Router } from 'express';
import {
  processPayroll, reviewPayroll, getMyPayroll, getAllPayroll,
  getCTCBreakdown, markAsPaid,
} from '../controllers/payroll.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/my', getMyPayroll);
router.get('/ctc/:employeeId', authorize('admin'), getCTCBreakdown);
router.get('/', authorize('admin', 'hr'), getAllPayroll);
router.post('/process', authorize('admin'), processPayroll);
router.patch('/:id/review', authorize('admin'), reviewPayroll);
router.put('/:id/pay', authorize('admin'), markAsPaid);

export default router;