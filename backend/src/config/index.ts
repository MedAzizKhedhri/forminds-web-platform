import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  serverUrl: string;
  jwt: {
    privateKeyPath: string;
    publicKeyPath: string;
    accessExpiry: string;
    refreshExpiryDays: number;
  };
  frontend: {
    url: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  upload: {
    dir: string;
    maxFileSize: number;
  };
  ai: {
    baseUrl: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/forminds',
  serverUrl: process.env.SERVER_URL || `http://localhost:${parseInt(process.env.PORT || '5000', 10)}`,
  jwt: {
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || path.resolve(__dirname, '../../keys/private.pem'),
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || path.resolve(__dirname, '../../keys/public.pem'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiryDays: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10),
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'ForMinds <noreply@forminds.com>',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(5 * 1024 * 1024), 10), // 5MB default
  },
  ai: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },
};

export default config;
