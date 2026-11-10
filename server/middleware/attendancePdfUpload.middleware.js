import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['application/pdf', 'application/x-pdf', 'application/octet-stream'].includes(file.mimetype)) {
      callback(new Error('Upload a PDF attendance report.'));
      return;
    }
    callback(null, true);
  },
});

export const acceptAttendancePdf = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'PDF must be 8 MB or smaller.'
        : error.message || 'Unable to read the uploaded PDF.';
      next(new ApiError(400, message));
      return;
    }
    if (!req.file) {
      next(new ApiError(400, 'Choose a PDF file to preview.'));
      return;
    }
    if (req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
      next(new ApiError(400, 'The selected file is not a valid PDF.'));
      return;
    }
    next();
  });
};
