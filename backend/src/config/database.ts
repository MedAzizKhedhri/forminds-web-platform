import mongoose from 'mongoose';
import config from './index';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);

    mongoose.connection.on('connected', () => {
      console.log('[MongoDB] Connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected');
    });

    console.log('[MongoDB] Initial connection established');
  } catch (error) {
    console.error('[MongoDB] Failed to connect:', (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;
