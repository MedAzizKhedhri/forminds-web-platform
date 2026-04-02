import fs from 'fs';
import config from './index';

let privateKey: Buffer;
let publicKey: Buffer;

try {
  privateKey = fs.readFileSync(config.jwt.privateKeyPath);
} catch (error) {
  console.error(
    `[JWT] Failed to load private key from "${config.jwt.privateKeyPath}". ` +
    'Ensure the file exists and is readable. ' +
    'Generate an RS256 key pair with:\n' +
    '  openssl genrsa -out keys/private.pem 2048\n' +
    '  openssl rsa -in keys/private.pem -pubout -out keys/public.pem'
  );
  process.exit(1);
}

try {
  publicKey = fs.readFileSync(config.jwt.publicKeyPath);
} catch (error) {
  console.error(
    `[JWT] Failed to load public key from "${config.jwt.publicKeyPath}". ` +
    'Ensure the file exists and is readable. ' +
    'Generate an RS256 key pair with:\n' +
    '  openssl genrsa -out keys/private.pem 2048\n' +
    '  openssl rsa -in keys/private.pem -pubout -out keys/public.pem'
  );
  process.exit(1);
}

export { privateKey, publicKey };
