import { Router } from 'express';
import {
  getMyReimbursements,
  getAllReimbursements,
  createReimbursement,
  updateReimbursementStatus,
} from '../controllers/reimbursement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/my', getMyReimbursements);

// FIXED: added 'manager' — controller already filters by team for managers
router.get('/', authorize('admin', 'hr', 'manager'), getAllReimbursements);

router.post('/', createReimbursement);

// Only admin/hr can approve or reject
router.patch('/:id/status', authorize('admin', 'hr'), updateReimbursementStatus);

export default router;