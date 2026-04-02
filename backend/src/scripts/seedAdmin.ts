import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config';
import User from '../models/User';
import { UserRole } from '../utils/constants';

const seedAdmin = async (): Promise<void> => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });

    if (existingAdmin) {
      console.log('[Seed] Admin user already exists. Skipping seed.');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);

    // Create admin user
    const admin = await User.create({
      email: 'admin@forminds.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'ForMinds',
      username: 'admin',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    console.log(`[Seed] Admin user created successfully:`);
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role:     ${admin.role}`);

    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB');
  } catch (error) {
    console.error('[Seed] Error:', (error as Error).message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
