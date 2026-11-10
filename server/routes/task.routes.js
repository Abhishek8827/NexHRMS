import { Router } from 'express';
import { getTasks, createTask, updateTask, updateTaskStatus, addComment, deleteTask } from '../controllers/task.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, authorize('admin'));

router.get('/', getTasks);
router.post('/', authorize('admin', 'hr'), createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comment', addComment);
router.delete('/:id', authorize('admin', 'hr'), deleteTask);

export default router;