import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import User from './models/User.model.js';
import https from 'https';
import http from 'http';

const PORT = process.env.PORT || 5000;

// ── Seed Admin ────────────────────────────────────────────
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        firstName: process.env.ADMIN_FIRST_NAME || 'System',
        lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@nexhr.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
        status: 'active',
        employeeId: 'EMP-001',
      });
      console.log('✅ Default admin created');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

// ── Seed Departments ──────────────────────────────────────
const seedDepartments = async () => {
  try {
    const { default: Department } = await import('./models/Department.model.js');
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany([
        { name: 'Engineering', code: 'ENG', description: 'Software development team' },
        { name: 'Human Resources', code: 'HR', description: 'HR and people management' },
        { name: 'Finance', code: 'FIN', description: 'Finance and accounts' },
        { name: 'Marketing', code: 'MKT', description: 'Marketing and growth' },
        { name: 'Operations', code: 'OPS', description: 'Operations and admin' },
        { name: 'Sales', code: 'SAL', description: 'Sales team' },
        { name: 'Design', code: 'DES', description: 'UI/UX and design' },
      ]);
      console.log('✅ Default departments seeded');
    }
  } catch (err) {
    console.error('Department seed error:', err.message);
  }
};

// ── Seed Demo Employees (HR, Manager, Employee) ───────────
// These are the demo accounts shown on the login page
// They are seeded once — subsequent runs check if they exist
const seedDemoAccounts = async () => {
  try {
    const { default: Department } = await import('./models/Department.model.js');

    // Get departments for assignment
    const hrDept = await Department.findOne({ code: 'HR' });
    const engDept = await Department.findOne({ code: 'ENG' });

    // ── Demo HR Manager ───────────────────────────────────
    const hrExists = await User.findOne({ email: 'hr@nexhr.com' });
    if (!hrExists) {
      await User.create({
        employeeId: 'EMP-002',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'hr@nexhr.com',
        password: 'Hr@123456',
        role: 'hr',
        status: 'active',
        designation: 'HR Manager',
        department: hrDept?._id || null,
        joiningDate: new Date('2023-01-15'),
        phone: '+91 98765 43210',
        basicSalary: 65000,
      });
      console.log('✅ Demo HR account created → hr@nexhr.com / Hr@123456');
    }

    // ── Demo Manager ──────────────────────────────────────
    const managerExists = await User.findOne({ email: 'manager@nexhr.com' });
    let managerId = managerExists?._id;

    if (!managerExists) {
      const manager = await User.create({
        employeeId: 'EMP-003',
        firstName: 'Rahul',
        lastName: 'Verma',
        email: 'manager@nexhr.com',
        password: 'Manager@123456',
        role: 'manager',
        status: 'active',
        designation: 'Engineering Manager',
        department: engDept?._id || null,
        joiningDate: new Date('2022-06-01'),
        phone: '+91 98765 43211',
        basicSalary: 85000,
      });
      managerId = manager._id;
      console.log('✅ Demo Manager account created → manager@nexhr.com / Manager@123456');
    }

    // ── Demo Employee ─────────────────────────────────────
    const empExists = await User.findOne({ email: 'employee@nexhr.com' });
    if (!empExists) {
      await User.create({
        employeeId: 'EMP-004',
        firstName: 'Arjun',
        lastName: 'Patel',
        email: 'employee@nexhr.com',
        password: 'Employee@123456',
        role: 'employee',
        status: 'active',
        designation: 'Software Developer',
        department: engDept?._id || null,
        manager: managerId || null,
        joiningDate: new Date('2023-03-10'),
        phone: '+91 98765 43212',
        basicSalary: 45000,
      });
      console.log('✅ Demo Employee account created → employee@nexhr.com / Employee@123456');
    }

  } catch (err) {
    console.error('Demo accounts seed error:', err.message);
  }
};

// ── Keep-Alive: Prevent Render Free Tier Sleep ────────────
// Render free tier sleeps after 15 minutes of no traffic
// This pings the server itself every 14 minutes to stay awake
const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const serverUrl = process.env.RENDER_EXTERNAL_URL ||
    `https://nexhr-api.onrender.com`;

  // Ping every 14 minutes (Render sleeps after 15min)
  setInterval(() => {
    const url = new URL(`${serverUrl}/health`);
    const client = url.protocol === 'https:' ? https : http;

    client.get(url.toString(), (res) => {
      console.log(`♻️  Keep-alive ping: ${res.statusCode} at ${new Date().toISOString()}`);
    }).on('error', (err) => {
      console.error('Keep-alive ping failed:', err.message);
    });
  }, 14 * 60 * 1000); // 14 minutes

  console.log('♻️  Keep-alive scheduler started (every 14 min)');
};

// ── Start Server ──────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  // Seed in correct order — departments first, then users
  await createDefaultAdmin();
  await seedDepartments();
  await seedDemoAccounts();  // ← NEW: seeds HR, Manager, Employee

  app.listen(PORT, () => {
    console.log(`\n🚀 NexHR API running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/v1`);
    console.log(`🏥 Health: http://localhost:${PORT}/health\n`);

    // Start keep-alive only in production
    startKeepAlive();
  });
};

// ── Global Error Handlers ─────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();