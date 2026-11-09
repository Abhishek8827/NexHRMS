import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import User from './models/User.model.js';
import https from 'https';
import http from 'http';


const PORT = process.env.PORT || 5000;

const ensureBootstrapAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    console.log('ADMIN_EMAIL is not set; no bootstrap admin was created.');
    return;
  }

  const existingAccount = await User.findOne({ email });
  if (existingAccount) {
    existingAccount.role = 'admin';
    await existingAccount.save({ validateBeforeSave: false });
    console.log('✅ Bootstrap admin role assigned to configured account');
    return;
  }

  await User.create({
    firstName: process.env.ADMIN_FIRST_NAME || 'System',
    lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
    email,
    role: 'admin',
    status: 'active',
  });
  console.log('✅ Bootstrap admin profile created; provision its Firebase sign-in separately');
};

const migrateLegacyManagerRoles = async () => {
  const result = await User.updateMany(
    { role: 'manager' },
    { $set: { role: 'employee' } },
  );

  if (result.modifiedCount > 0) {
    console.log(`✅ Converted ${result.modifiedCount} legacy manager accounts to employee accounts`);
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

const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const serverUrl =
    process.env.RENDER_EXTERNAL_URL || 'https://nexhr-api.onrender.com';
  setInterval(() => {
    const url = new URL(`${serverUrl}/health`);
    const client = url.protocol === 'https:' ? https : http;
    client
      .get(url.toString(), (res) => {
        console.log(`♻️  Keep-alive: ${res.statusCode}`);
      })
      .on('error', () => {});
  }, 14 * 60 * 1000);
  console.log('♻️  Keep-alive started (every 14 min)');
};

const startServer = async () => {
  await connectDB();
  await migrateLegacyManagerRoles();
  await ensureBootstrapAdmin();
  await seedDepartments();

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