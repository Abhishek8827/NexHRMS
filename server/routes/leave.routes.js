import { Router } from 'express';
import {
  applyLeave, getMyLeaves, getPendingLeaves,
  getAllLeaves, approveLeave, rejectLeave,
  cancelLeave, getLeaveBalance,
} from '../controllers/leave.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, authorize('admin'));

router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.get('/pending', authorize('admin', 'hr'), getPendingLeaves);
router.get('/all', authorize('admin', 'hr'), getAllLeaves);
router.put('/:id/approve', authorize('admin', 'hr'), approveLeave);
router.put('/:id/reject', authorize('admin', 'hr'), rejectLeave);
router.put('/:id/cancel', cancelLeave);

export default router;