import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import User from '../models/User';
import config from '../config';
import * as authService from '../services/auth.service';
import * as tokenService from '../services/token.service';
import { ApiResponse, JwtPayload } from '../types';

// ─────────────────────────────────────────────────
// Zod Validation Schemas
// ─────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-z0-9_-]+$/,
      'Username can only contain lowercase letters, numbers, hyphens, and underscores'
    ),
  role: z.enum(['student', 'recruiter'], {
    errorMap: () => ({ message: 'Role must be either "student" or "recruiter"' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  email: z.string().email('Invalid email address'),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const twoFactorSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z
    .string()
    .length(6, '2FA code must be 6 digits')
    .regex(/^\d{6}$/, '2FA code must be a 6-digit number'),
});

export const confirm2FASchema = z.object({
  code: z
    .string()
    .length(6, '2FA code must be 6 digits')
    .regex(/^\d{6}$/, '2FA code must be a 6-digit number'),
});

// ─────────────────────────────────────────────────
// Cookie Helper
// ─────────────────────────────────────────────────

/**
 * Parses a specific cookie value from the raw Cookie header.
 */
function parseCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

/**
 * Sets the refresh token as an httpOnly cookie.
 */
function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
}

/**
 * Clears the refresh token cookie.
 */
function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
  });
}

// ─────────────────────────────────────────────────
// Controller Handlers
// ─────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = registerSchema.parse(req.body);

  const user = await authService.register(data as Parameters<typeof authService.register>[0]);

  const response: ApiResponse = {
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user },
  };

  res.status(201).json(response);
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const result = await authService.login(email, password);

  if (result.requires2FA) {
    const response: ApiResponse = {
      success: true,
      message: 'Two-factor authentication code sent to your email.',
      data: { requires2FA: true },
    };
    res.status(200).json(response);
    return;
  }

  // Set refresh token cookie
  setRefreshTokenCookie(res, result.refreshToken!);

  const response: ApiResponse = {
    success: true,
    message: 'Login successful.',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = parseCookie(req, REFRESH_TOKEN_COOKIE);

  if (refreshToken && req.user) {
    // Revoke all refresh tokens for the user
    await tokenService.revokeAllRefreshTokens(req.user.userId);
  }

  clearRefreshTokenCookie(res);

  const response: ApiResponse = {
    success: true,
    message: 'Logged out successfully.',
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = parseCookie(req, REFRESH_TOKEN_COOKIE);

  if (!refreshToken) {
    throw new AppError('No refresh token provided.', 401);
  }

  // Decode the existing access token to get userId (even if expired)
  // Or extract from the refresh token flow
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.split(' ')[1];
    try {
      const decoded = tokenService.verifyAccessToken(accessToken);
      userId = decoded.userId;
    } catch {
      // Token may be expired, try to decode without verification
      const decoded = jwt.decode(accessToken) as JwtPayload | null;
      userId = decoded?.userId;
    }
  }

  const tokens = await tokenService.refreshTokens(refreshToken, userId);

  // Set new refresh token cookie
  setRefreshTokenCookie(res, tokens.refreshToken);

  const response: ApiResponse = {
    success: true,
    message: 'Tokens refreshed successfully.',
    data: {
      accessToken: tokens.accessToken,
    },
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, email } = verifyEmailSchema.parse(req.body);

  await authService.verifyEmail(token, email);

  const response: ApiResponse = {
    success: true,
    message: 'Email verified successfully. You can now log in.',
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/resend-verification
 */
export const resendVerification = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = forgotPasswordSchema.parse(req.body);

    await authService.resendVerification(email);

    const response: ApiResponse = {
      success: true,
      message: 'If an unverified account exists with this email, a verification link has been sent.',
    };

    res.status(200).json(response);
  }
);

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = forgotPasswordSchema.parse(req.body);

    await authService.forgotPassword(email);

    const response: ApiResponse = {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    res.status(200).json(response);
  }
);

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token, email, newPassword } = resetPasswordSchema.parse(req.body);

    await authService.resetPassword(token, email, newPassword);

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    };

    res.status(200).json(response);
  }
);

/**
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    await authService.changePassword(req.user.userId, currentPassword, newPassword);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully.',
    };

    res.status(200).json(response);
  }
);
/**
 * POST /api/auth/enable-2fa
 */
export const enable2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  await authService.enable2FA(req.user.userId);

  const response: ApiResponse = {
    success: true,
    message: 'A 2FA verification code has been sent to your email.',
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/confirm-2fa
 */
export const confirm2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { code } = confirm2FASchema.parse(req.body);

  await authService.confirm2FA(req.user.userId, code);

  const response: ApiResponse = {
    success: true,
    message: 'Two-factor authentication has been enabled successfully.',
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/disable-2fa
 */
export const disable2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  await authService.disable2FA(req.user.userId);

  const response: ApiResponse = {
    success: true,
    message: 'Two-factor authentication has been disabled successfully.',
  };

  res.status(200).json(response);
});

/**
 * POST /api/auth/verify-2fa
 */
export const verify2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, code } = twoFactorSchema.parse(req.body);

  const result = await authService.verify2FA(email, code);

  // Set refresh token cookie
  setRefreshTokenCookie(res, result.refreshToken);

  const response: ApiResponse = {
    success: true,
    message: 'Two-factor authentication verified successfully.',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  };

  res.status(200).json(response);
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'User data retrieved successfully.',
    data: { user },
  };

  res.status(200).json(response);
});
