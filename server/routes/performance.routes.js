import { Router } from 'express';
import {
  getMyReviews, getAllReviews, createReview,
  updateReview, submitSelfReview, submitManagerReview,
} from '../controllers/performance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/my', getMyReviews);
router.get('/', authorize('admin', 'hr'), getAllReviews);
router.post('/', authorize('admin', 'hr'), createReview);
router.put('/:id', authorize('admin', 'hr'), updateReview);
router.put('/:id/self-review', submitSelfReview);
router.put('/:id/manager-review', authorize('admin', 'hr'), submitManagerReview);

export default router;