import { Router } from 'express';
import {
  punchIn, punchOut, getTodayAttendance,
  getMyAttendance, getTeamAttendance,
  manualMark, getAllAttendance,
} from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);
router.get('/today', getTodayAttendance);
router.get('/my', getMyAttendance);
router.get('/team', authorize('admin', 'hr', 'manager'), getTeamAttendance);
router.get('/all', authorize('admin', 'hr'), getAllAttendance);
router.post('/mark', authorize('admin', 'hr'), manualMark);

export default router;