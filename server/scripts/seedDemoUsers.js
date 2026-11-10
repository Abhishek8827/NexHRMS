import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import connectDB from '../config/db.js';
import { getFirebaseAuth } from '../config/firebase.js';
import User from '../models/User.model.js';
import { generateEmployeeId } from '../utils/generateEmployeeId.js';

const demoUsers = [
  { firstName: 'Riley', lastName: 'HR Demo', email: 'hr.demo@example.com', role: 'hr', designation: 'HR Coordinator' },
  { firstName: 'Alex', lastName: 'Sample', email: 'employee1.demo@example.com', role: 'employee', designation: 'Staff Member' },
  { firstName: 'Jamie', lastName: 'Sample', email: 'employee2.demo@example.com', role: 'employee', designation: 'Staff Member' },
  { firstName: 'Taylor', lastName: 'Sample', email: 'employee3.demo@example.com', role: 'employee', designation: 'Staff Member' },
  { firstName: 'Morgan', lastName: 'Sample', email: 'employee4.demo@example.com', role: 'employee', designation: 'Staff Member' },
];

const generateTemporaryPassword = () => `${randomBytes(18).toString('base64url')}aA1!`;

const findFirebaseUserByEmail = async (firebaseAuth, email) => {
  try {
    return await firebaseAuth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') return null;
    throw error;
  }
};

const createDemoUsers = async () => {
  if (!['development', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error('Demo accounts may only be seeded when NODE_ENV=development or test');
  }
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Set ALLOW_DEMO_SEED=true for this one-time development-only operation');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await connectDB();
  const firebaseAuth = getFirebaseAuth();
  const created = [];

  try {
    for (const demoUser of demoUsers) {
      const existingProfile = await User.findOne({ email: demoUser.email }).select('+firebaseUid');
      const existingIdentity = await findFirebaseUserByEmail(firebaseAuth, demoUser.email);

      if (existingProfile && existingIdentity) {
        if (existingProfile.firebaseUid === existingIdentity.uid) {
          console.log(`Already seeded: ${demoUser.email}; existing password is not shown.`);
          continue;
        }
        throw new Error(`Demo profile and Firebase identity are mismatched for ${demoUser.email}`);
      }

      if (existingProfile || existingIdentity) {
        throw new Error(`Partial demo account exists for ${demoUser.email}; resolve it before seeding again`);
      }

      const password = generateTemporaryPassword();
      const identity = await firebaseAuth.createUser({
        email: demoUser.email,
        password,
        displayName: `${demoUser.firstName} ${demoUser.lastName}`,
      });

      try {
        const profile = await User.create({
          firebaseUid: identity.uid,
          employeeId: await generateEmployeeId(),
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          email: demoUser.email,
          role: demoUser.role,
          designation: demoUser.designation,
          status: 'active',
        });
        created.push({ profileId: profile._id, identityUid: identity.uid, ...demoUser, password });
      } catch (error) {
        await firebaseAuth.deleteUser(identity.uid).catch(() => {});
        throw error;
      }
    }
  } catch (error) {
    await Promise.all(created.map(async ({ profileId, identityUid }) => {
      await User.findByIdAndDelete(profileId).catch(() => {});
      await firebaseAuth.deleteUser(identityUid).catch(() => {});
    }));
    throw error;
  }

  if (created.length === 0) {
    console.log('No new demo accounts were created. Existing passwords cannot be recovered by this script.');
    return;
  }

  console.log('\nDemo login credentials (copy them now; passwords are not saved or shown again):');
  console.table(created.map(({ firstName, lastName, email, role, employeeId, password }) => ({
    name: `${firstName} ${lastName}`,
    role,
    employeeId,
    email,
    password,
  })));
  console.log('These synthetic accounts are for development only. Do not deploy or reuse these credentials in production.');
};

createDemoUsers()
  .catch((error) => {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect().catch(() => {});
  });
