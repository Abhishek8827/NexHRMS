import { Router } from 'express';
import {
  getAllEmployees, getEmployeeById, updateOwnProfile,
  updateEmployee, deactivateEmployee,
} from '../controllers/employee.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { acceptEmployeeSpreadsheet } from '../middleware/employeeSpreadsheetUpload.middleware.js';
import {
  listEmployeeSpreadsheetImports,
  previewEmployeeSpreadsheetImport,
  confirmEmployeeSpreadsheetImport,
  getEmployeeSpreadsheetOriginal,
} from '../controllers/employeeImport.controller.js';

const router = Router();

router.use(protect);

router.put('/me', authorize('admin'), updateOwnProfile);
router.get('/imports', authorize('admin'), listEmployeeSpreadsheetImports);
router.post('/imports/preview', authorize('admin'), acceptEmployeeSpreadsheet, previewEmployeeSpreadsheetImport);
router.post('/imports/:id/confirm', authorize('admin'), confirmEmployeeSpreadsheetImport);
router.get('/imports/:id/original', authorize('admin'), getEmployeeSpreadsheetOriginal);
router.get('/', authorize('admin', 'hr'), getAllEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', authorize('admin'), updateEmployee);
router.delete('/:id', authorize('admin'), deactivateEmployee);

export default router;