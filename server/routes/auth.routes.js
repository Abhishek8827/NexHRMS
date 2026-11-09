import { Router } from 'express';
import { getCurrentUser, registerEmployee } from '../controllers/auth.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', protect, getCurrentUser);
router.post('/register', protect, authorize('admin', 'hr'), registerEmployee);

export default router;
