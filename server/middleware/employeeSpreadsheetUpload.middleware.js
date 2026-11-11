import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const MAX_SIZE = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    const name = String(file.originalname || '').toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) {
      callback(new Error('Use an .xlsx or .csv spreadsheet.'));
      return;
    }
    callback(null, true);
  },
});

export const acceptEmployeeSpreadsheet = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Spreadsheet must be 5 MB or smaller.'
        : error.message || 'Unable to read the uploaded spreadsheet.';
      next(new ApiError(400, message));
      return;
    }
    if (!req.file) {
      next(new ApiError(400, 'Choose a spreadsheet to preview.'));
      return;
    }
    const name = String(req.file.originalname || '').toLowerCase();
    if (name.endsWith('.xlsx') && req.file.buffer.subarray(0, 2).toString() !== 'PK') {
      next(new ApiError(400, 'The selected .xlsx file is not a valid Excel workbook.'));
      return;
    }
    if (name.endsWith('.csv') && req.file.buffer.includes(0)) {
      next(new ApiError(400, 'CSV file contains binary data. Save it as UTF-8 CSV and try again.'));
      return;
    }
    next();
  });
};
