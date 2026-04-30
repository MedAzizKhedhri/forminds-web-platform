import mongoose from 'mongoose';
import config from '../config';
import User from '../models/User';
import { UserRole } from '../utils/constants';

const deleteAdmin = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[Script] Connected to MongoDB');

    const result = await User.deleteMany({ role: UserRole.ADMIN });
    console.log(`[Script] Deleted ${result.deletedCount} admin user(s)`);

    await mongoose.disconnect();
    console.log('[Script] Done');
  } catch (error) {
    console.error('[Script] Error:', (error as Error).message);
    process.exit(1);
  }
};

deleteAdmin();
