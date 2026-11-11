import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { createPayrollRule, getPayrollRules } from '../controllers/payrollRule.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', getPayrollRules);
router.post('/', createPayrollRule);

export default router;
