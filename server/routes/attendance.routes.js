import { Router } from 'express';
import {
  punchIn, punchOut, getTodayAttendance,
  getMyAttendance, getMonthlyAttendance, getTeamAttendance,
  manualMark, getAllAttendance, getPunchExceptions,
  reviewPunchException,
} from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { acceptAttendancePdf } from '../middleware/attendancePdfUpload.middleware.js';
import {
  previewAttendancePdfImport,
  confirmAttendancePdfImport,
  listAttendanceImports,
  downloadAttendanceImportPdf,
} from '../controllers/attendanceImport.controller.js';

const router = Router();
router.use(protect);

router.post('/imports/preview', authorize('admin'), acceptAttendancePdf, previewAttendancePdfImport);
router.get('/imports', authorize('admin'), listAttendanceImports);
router.post('/imports/:id/confirm', authorize('admin'), confirmAttendancePdfImport);
router.get('/imports/:id/original', authorize('admin'), downloadAttendanceImportPdf);

router.post('/punch-in', authorize('admin'), punchIn);
router.post('/punch-out', authorize('admin'), punchOut);
router.get('/today', getTodayAttendance);
router.get('/my', getMyAttendance);
router.get('/monthly', getMonthlyAttendance);
router.get('/team', authorize('admin', 'hr'), getTeamAttendance);
router.get('/all', authorize('admin', 'hr'), getAllAttendance);
router.get('/exceptions', authorize('admin', 'hr'), getPunchExceptions);
router.patch('/:id/review', authorize('admin'), reviewPunchException);
router.post('/mark', authorize('admin'), manualMark);

export default router;