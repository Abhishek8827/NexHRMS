import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import User from './models/User.model.js';

const PORT = process.env.PORT || 5000;

const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ role: 'admin' });

  if (!adminExists) {
    await User.create({
      firstName: process.env.ADMIN_FIRST_NAME,
      lastName: process.env.ADMIN_LAST_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      status: 'active',
      employeeId: 'EMP-001',
    });

    console.log('✅ Default admin created');
    console.log(`   Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
  }
};


const seedDepartments = async () => {
  try {
    const { default: Department } = await import('./models/Department.model.js');

    const count = await Department.countDocuments();

    if (count === 0) {
      await Department.insertMany([
        {
          name: 'Engineering',
          code: 'ENG',
          description: 'Software development team',
        },
        {
          name: 'Human Resources',
          code: 'HR',
          description: 'HR and people management',
        },
        {
          name: 'Finance',
          code: 'FIN',
          description: 'Finance and accounts',
        },
        {
          name: 'Marketing',
          code: 'MKT',
          description: 'Marketing and growth',
        },
        {
          name: 'Operations',
          code: 'OPS',
          description: 'Operations and admin',
        },
        {
          name: 'Sales',
          code: 'SAL',
          description: 'Sales team',
        },
        {
          name: 'Design',
          code: 'DES',
          description: 'UI/UX and design',
        },
      ]);

      console.log('✅ Default departments seeded');
    }
  } catch (err) {
    console.log('Departments already exist or seeding skipped');
  }
};


const startServer = async () => {
  await connectDB();

  await createDefaultAdmin();

  await seedDepartments();

  app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/v1`);

  // Keep Render free tier alive (pings every 14 min to prevent sleep)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      console.log('♻️  Server heartbeat:', new Date().toISOString());
    }, 14 * 60 * 1000);
  }
});
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Catch synchronous crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();