import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { privateKey, publicKey } from '../config/jwt';
import config from '../config';
import Token, { IToken } from '../models/Token';
import { IUser } from '../models/User';
import { JwtPayload } from '../types';
import { TokenType } from '../utils/constants';
import AppError from '../utils/AppError';

/**
 * Generates a signed JWT access token using RS256.
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.accessExpiry as string,
  } as jwt.SignOptions);
};

/**
 * Generates a refresh token (UUID v4), stores a bcrypt hash in the database,
 * and returns the plain token.
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const plainToken = uuidv4();
  const hashedToken = await bcrypt.hash(plainToken, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiryDays);

  await Token.create({
    userId,
    token: hashedToken,
    type: TokenType.REFRESH,
    expiresAt,
  });

  return plainToken;
};

/**
 * Verifies a JWT access token using the RS256 public key.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
};

/**
 * Validates a refresh token against the database, invalidates the old one,
 * and generates new access and refresh tokens.
 */
export const refreshTokens = async (
  refreshToken: string,
  userId?: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  // Find all non-expired, unused refresh tokens (scoped to user if userId provided)
  const query: { type: TokenType; isUsed: boolean; expiresAt: { $gt: Date }; userId?: string } = {
    type: TokenType.REFRESH,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  };

  if (userId) {
    query.userId = userId;
  }

  const storedTokens = await Token.find(query);

  // Check if any stored token matches the provided refresh token
  let matchedToken: IToken | null = null;
  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(refreshToken, stored.token);
    if (isMatch) {
      matchedToken = stored;
      break;
    }
  }

  if (!matchedToken) {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const resolvedUserId = userId || matchedToken.userId.toString();

  // Invalidate the old token
  matchedToken.isUsed = true;
  await matchedToken.save();

  // Import User model lazily to avoid circular dependency
  const User = (await import('../models/User')).default;
  const user = await User.findById(resolvedUserId);

  if (!user) {
    throw new AppError('User not found.', 401);
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(resolvedUserId);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Marks all refresh tokens for a user as used (revoked).
 */
export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  await Token.updateMany(
    { userId, type: TokenType.REFRESH, isUsed: false },
    { isUsed: true }
  );
};

/**
 * Generates an email verification token (UUID v4), stores it in the DB,
 * and returns the plain token.
 */
export const generateVerificationToken = async (userId: string): Promise<string> => {
  const plainToken = uuidv4();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  await Token.create({
    userId,
    token: plainToken,
    type: TokenType.EMAIL_VERIFICATION,
    expiresAt,
  });

  return plainToken;
};

/**
 * Generates a password reset token (UUID v4), invalidates any existing
 * reset tokens for the user, stores the new one, and returns the plain token.
 */
export const generatePasswordResetToken = async (userId: string): Promise<string> => {
  // Invalidate existing reset tokens for this user
  await Token.updateMany(
    { userId, type: TokenType.PASSWORD_RESET, isUsed: false },
    { isUsed: true }
  );

  const plainToken = uuidv4();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

  await Token.create({
    userId,
    token: plainToken,
    type: TokenType.PASSWORD_RESET,
    expiresAt,
  });

  return plainToken;
};

/**
 * Generates a 6-digit numeric 2FA code, stores it in the DB,
 * and returns the code.
 */
export const generate2FACode = async (userId: string): Promise<string> => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

  await Token.create({
    userId,
    token: code,
    type: TokenType.TWO_FACTOR,
    expiresAt,
  });

  return code;
};

/**
 * Validates a token against the database.
 * Finds a token matching the type, not used, and not expired.
 * Returns the Token document or null.
 */
export const validateToken = async (
  token: string,
  type: TokenType
): Promise<IToken | null> => {
  const tokenDoc = await Token.findOne({
    token,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  return tokenDoc;
};
