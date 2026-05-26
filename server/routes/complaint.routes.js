import { Router } from 'express';
import { getComplaints, createComplaint, updateComplaintStatus } from '../controllers/complaint.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getComplaints);
router.post('/', createComplaint);
router.patch('/:id/status', authorize('admin', 'hr'), updateComplaintStatus);

export default router;