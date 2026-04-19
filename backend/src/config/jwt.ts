import fs from 'fs';
import config from './index';

let privateKey: Buffer;
let publicKey: Buffer;

// In production (e.g. Railway), keys are stored as environment variables.
// Locally, they are loaded from .pem files.
const privateKeyEnv = process.env.JWT_PRIVATE_KEY;
const publicKeyEnv = process.env.JWT_PUBLIC_KEY;

if (privateKeyEnv) {
  // Replace escaped newlines (\n) stored in env var with real newlines
  privateKey = Buffer.from(privateKeyEnv.replace(/\\n/g, '\n'));
} else {
  try {
    privateKey = fs.readFileSync(config.jwt.privateKeyPath);
  } catch {
    console.error(
      `[JWT] Failed to load private key. Set JWT_PRIVATE_KEY env var or ensure "${config.jwt.privateKeyPath}" exists.\n` +
      'Generate with: openssl genrsa -out keys/private.pem 2048'
    );
    process.exit(1);
  }
}

if (publicKeyEnv) {
  publicKey = Buffer.from(publicKeyEnv.replace(/\\n/g, '\n'));
} else {
  try {
    publicKey = fs.readFileSync(config.jwt.publicKeyPath);
  } catch {
    console.error(
      `[JWT] Failed to load public key. Set JWT_PUBLIC_KEY env var or ensure "${config.jwt.publicKeyPath}" exists.\n` +
      'Generate with: openssl rsa -in keys/private.pem -pubout -out keys/public.pem'
    );
    process.exit(1);
  }
}

export { privateKey, publicKey };
