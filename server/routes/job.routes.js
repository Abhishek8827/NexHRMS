import { Router } from 'express';
import {
  getJobs, createJob, updateJob, deleteJob,
  getJobCandidates, updateCandidateStage,
} from '../controllers/job.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

// IMPORTANT: specific routes MUST come before parameterized routes
// /candidates/:id/stage must be defined BEFORE /:id
router.put('/candidates/:id/stage', authorize('admin', 'hr'), updateCandidateStage);

router.get('/', getJobs);
router.post('/', authorize('admin', 'hr'), createJob);
router.put('/:id', authorize('admin', 'hr'), updateJob);
router.delete('/:id', authorize('admin', 'hr'), deleteJob);
router.get('/:jobId/candidates', authorize('admin', 'hr'), getJobCandidates);

export default router;