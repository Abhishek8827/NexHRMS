import { Router } from 'express';
import {
  registerEmployee, loginUser, logoutUser,
  refreshAccessToken, getCurrentUser, changePassword,
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getCurrentUser);
router.post('/change-password', protect, changePassword);
router.post('/register', protect, authorize('admin', 'hr'), registerEmployee);

export default router;