import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import User from './models/User.model.js';
import https from 'https';
import http from 'http';

const PORT = process.env.PORT || 5000;

const createDefaultAdmin = async () => {
  try {
    const exists = await User.findOne({ 
      $or: [{ role: 'admin' }, { email: process.env.ADMIN_EMAIL || 'admin@nexhr.com' }]
    });
    if (!exists) {
      await User.create({
        firstName: process.env.ADMIN_FIRST_NAME || 'System',
        lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@nexhr.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
        status: 'active',
        employeeId: 'EMP-001',
      });
      console.log('✅ Admin created');
    } else {
      console.log('⚠️  Admin already exists (skipped)');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

const seedDepartments = async () => {
  try {
    const { default: Department } = await import('./models/Department.model.js');
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany([
        { name: 'Engineering', code: 'ENG', description: 'Software development' },
        { name: 'Human Resources', code: 'HR', description: 'HR and people management' },
        { name: 'Finance', code: 'FIN', description: 'Finance and accounts' },
        { name: 'Marketing', code: 'MKT', description: 'Marketing and growth' },
        { name: 'Operations', code: 'OPS', description: 'Operations and admin' },
        { name: 'Sales', code: 'SAL', description: 'Sales team' },
        { name: 'Design', code: 'DES', description: 'UI/UX and design' },
      ]);
      console.log('✅ Departments seeded');
    }
  } catch (err) {
    console.error('Department seed error:', err.message);
  }
};

const seedDemoAccounts = async () => {
  try {
    const { default: Department } = await import('./models/Department.model.js');
    const hrDept = await Department.findOne({ code: 'HR' });
    const engDept = await Department.findOne({ code: 'ENG' });

    // ── Each account seeded INDEPENDENTLY ──────────────────
    // Checks BOTH email AND employeeId before creating
    // One failure does NOT block others

    const demoAccounts = [
      {
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
      },
      {
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
      },
      {
        employeeId: 'EMP-004',
        firstName: 'Arjun',
        lastName: 'Patel',
        email: 'employee@nexhr.com',
        password: 'Employee@123456',
        role: 'employee',
        status: 'active',
        designation: 'Software Developer',
        department: engDept?._id || null,
        joiningDate: new Date('2023-03-10'),
        phone: '+91 98765 43212',
        basicSalary: 45000,
      },
    ];

    for (const account of demoAccounts) {
      try {
        // Check BOTH email and employeeId — this is what was missing before
        const exists = await User.findOne({
          $or: [
            { email: account.email },
            { employeeId: account.employeeId },
          ],
        });

        if (!exists) {
          await User.create(account);
          console.log(`✅ Demo ${account.role} created → ${account.email}`);
        } else {
          console.log(`⚠️  Demo ${account.role} already exists → skipped`);
        }
      } catch (err) {
        // Each account fails independently — won't block others
        if (err.code === 11000) {
          console.log(`⚠️  Demo ${account.role} duplicate → skipped`);
        } else {
          console.error(`Seed error (${account.email}):`, err.message);
        }
      }
    }

    // Set manager reference for demo employee
    const manager = await User.findOne({ email: 'manager@nexhr.com' });
    const employee = await User.findOne({ email: 'employee@nexhr.com' });
    if (manager && employee && !employee.manager) {
      await User.findByIdAndUpdate(employee._id, { manager: manager._id });
      console.log('✅ Manager assigned to demo employee');
    }

  } catch (err) {
    console.error('Demo seed outer error:', err.message);
  }
};

const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const serverUrl = process.env.RENDER_EXTERNAL_URL || 'https://nexhr-api.onrender.com';
  setInterval(() => {
    const url = new URL(`${serverUrl}/health`);
    const client = url.protocol === 'https:' ? https : http;
    client.get(url.toString(), (res) => {
      console.log(`♻️  Keep-alive: ${res.statusCode}`);
    }).on('error', () => {});
  }, 14 * 60 * 1000);
  console.log('♻️  Keep-alive started');
};

const startServer = async () => {
  await connectDB();
  await createDefaultAdmin();
  await seedDepartments();
  await seedDemoAccounts();

  app.listen(PORT, () => {
    console.log(`\n🚀 NexHR API running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/v1`);
    console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
    startKeepAlive();
  });
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();