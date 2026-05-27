import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import errorHandler from './middleware/error.middleware.js';

// Import ALL routes
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import departmentRoutes from './routes/department.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import taskRoutes from './routes/task.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import reimbursementRoutes from './routes/reimbursement.routes.js';
import reportRoutes from './routes/report.routes.js';
import jobRoutes from './routes/job.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import performanceRoutes from './routes/performance.routes.js';
import workScheduleRoutes from './routes/workSchedule.routes.js';

const app = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, also allow any vercel.app subdomain
      if (process.env.NODE_ENV === 'production' && origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
// ── Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'NexHR API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/reimbursements', reimbursementRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/schedules', workScheduleRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

export default app;