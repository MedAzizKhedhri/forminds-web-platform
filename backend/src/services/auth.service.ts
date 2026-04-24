import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import StudentProfile from '../models/StudentProfile';
import RecruiterProfile from '../models/RecruiterProfile';
import AppError from '../utils/AppError';
import { UserRole, TokenType } from '../utils/constants';
import * as tokenService from './token.service';
import * as emailService from './email.service';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
}

interface LoginResult {
  user?: IUser;
  accessToken?: string;
  refreshToken?: string;
  requires2FA?: boolean;
}

/**
 * Registers a new user account.
 */
export const register = async (data: RegisterData): Promise<IUser> => {
  // Check if email already exists
  const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
  if (existingEmail) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username: data.username.toLowerCase() });
  if (existingUsername) {
    throw new AppError('This username is already taken.', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create user
  const user = await User.create({
    email: data.email.toLowerCase(),
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username.toLowerCase(),
    role: data.role,
    isEmailVerified: true, // Auto-verify for testing
  });

  // Create empty profile based on role
  if (data.role === UserRole.STUDENT) {
    await StudentProfile.create({ userId: user._id });
  } else if (data.role === UserRole.RECRUITER) {
    await RecruiterProfile.create({ userId: user._id });
  }

  // Generate verification token and send email
  const verificationToken = await tokenService.generateVerificationToken(
    user._id.toString()
  );
  await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

  return user;
};

/**
 * Authenticates a user with email and password.
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  // Find user with password field included
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Check email verification
  if (!user.isEmailVerified) {
    throw new AppError(
      'Please verify your email address before logging in. Check your inbox for the verification link.',
      403
    );
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact support.',
      403
    );
  }

  // If 2FA is enabled, send 2FA code and return early
  if (user.is2FAEnabled) {
    const code = await tokenService.generate2FACode(user._id.toString());
    await emailService.send2FACode(user.email, user.firstName, code);

    return { requires2FA: true };
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user._id.toString());

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};

/**
 * Verifies a user's email address.
 */
export const verifyEmail = async (token: string, email: string): Promise<void> => {
  const tokenDoc = await tokenService.validateToken(token, TokenType.EMAIL_VERIFICATION);

  if (!tokenDoc) {
    throw new AppError('Invalid or expired verification token.', 400);
  }

  // Find the user
  const user = await User.findOne({ _id: tokenDoc.userId, email: email.toLowerCase() });

  if (!user) {
    throw new AppError('Invalid verification request.', 400);
  }

  // Mark token as used
  tokenDoc.isUsed = true;
  await tokenDoc.save();

  // Mark email as verified
  user.isEmailVerified = true;
  await user.save();
};

/**
 * Resends an email verification link.
 */
export const resendVerification = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal whether the email exists
    return;
  }

  if (user.isEmailVerified) {
    throw new AppError('This email is already verified.', 400);
  }

  const verificationToken = await tokenService.generateVerificationToken(
    user._id.toString()
  );
  await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
};

/**
 * Initiates the password reset flow.
 * Always returns success to avoid leaking email existence.
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const resetToken = await tokenService.generatePasswordResetToken(
      user._id.toString()
    );
    await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
  }

  // Always succeed - don't reveal whether email exists
};

/**
 * Resets a user's password using a valid reset token.
 */
export const resetPassword = async (
  token: string,
  email: string,
  newPassword: string
): Promise<void> => {
  const tokenDoc = await tokenService.validateToken(token, TokenType.PASSWORD_RESET);

  if (!tokenDoc) {
    // Provide a specific error message to help diagnose the issue
    const Token = (await import('../models/Token')).default;
    const existingToken = await Token.findOne({ token, type: TokenType.PASSWORD_RESET });

    if (!existingToken) {
      throw new AppError('Password reset token not found. Please request a new reset link.', 400);
    } else if (existingToken.isUsed) {
      throw new AppError('This password reset link has already been used. Please request a new one.', 400);
    } else if (existingToken.expiresAt < new Date()) {
      throw new AppError('This password reset link has expired. Please request a new one.', 400);
    }
    throw new AppError('Invalid or expired password reset token.', 400);
  }

  const user = await User.findOne({ _id: tokenDoc.userId, email: email.toLowerCase() });

  if (!user) {
    throw new AppError('Invalid password reset request.', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  user.password = hashedPassword;
  await user.save();

  // Mark token as used
  tokenDoc.isUsed = true;
  await tokenDoc.save();

  // Revoke all refresh tokens for security
  await tokenService.revokeAllRefreshTokens(user._id.toString());
};

/**
 * Changes a user's password using their current password for verification.
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid current password.', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  await tokenService.revokeAllRefreshTokens(user._id.toString());
};

/**
 * Initiates the 2FA enable flow for an authenticated user.
 */
export const enable2FA = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const code = await tokenService.generate2FACode(userId);
  await emailService.send2FACode(user.email, user.firstName, code);
};

/**
 * Confirms 2FA enablement with a valid code.
 */
export const confirm2FA = async (userId: string, code: string): Promise<void> => {
  const tokenDoc = await tokenService.validateToken(code, TokenType.TWO_FACTOR);

  if (!tokenDoc || tokenDoc.userId.toString() !== userId) {
    throw new AppError('Invalid or expired 2FA code.', 400);
  }

  // Mark code as used
  tokenDoc.isUsed = true;
  await tokenDoc.save();

  // Enable 2FA on the user account
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.is2FAEnabled = true;
  await user.save();
};

/**
 * Disables 2FA for an authenticated user.
 */
export const disable2FA = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (!user.is2FAEnabled) {
    throw new AppError('Two-factor authentication is not enabled.', 400);
  }

  user.is2FAEnabled = false;
  await user.save();
};

/**
 * Verifies a 2FA code during login and issues tokens.
 */
export const verify2FA = async (
  email: string,
  code: string
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError('Invalid 2FA verification request.', 400);
  }

  const tokenDoc = await tokenService.validateToken(code, TokenType.TWO_FACTOR);

  if (!tokenDoc || tokenDoc.userId.toString() !== user._id.toString()) {
    throw new AppError('Invalid or expired 2FA code.', 400);
  }

  // Mark code as used
  tokenDoc.isUsed = true;
  await tokenDoc.save();

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user._id.toString());

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};
