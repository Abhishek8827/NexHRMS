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

router.get('/', authorize('admin', 'hr'), getAllReimbursements);

router.post('/', createReimbursement);

// Only admin/hr can approve or reject
router.patch('/:id/status', authorize('admin', 'hr'), updateReimbursementStatus);

export default router;