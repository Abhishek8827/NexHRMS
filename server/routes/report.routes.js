import { Router } from 'express';
import { getDashboardStats, getAttendanceReport } from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/dashboard', authorize('admin', 'hr'), getDashboardStats);
router.get('/attendance', authorize('admin', 'hr'), getAttendanceReport);

export default router;