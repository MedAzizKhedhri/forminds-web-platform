import 'dotenv/config';
import config from './config';
import connectDB from './config/database';
import app from './app';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`[Server] Running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

startServer().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});
