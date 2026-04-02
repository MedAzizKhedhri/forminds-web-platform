import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import User from '../models/User';
import { ApiResponse } from '../types';
import * as adminService from '../services/admin.service';

/**
 * GET /api/users
 * Lists all users with pagination and optional filters. Admin only.
 * Query params: role, status (active|suspended), search, page, limit
 */
export const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  // Build filter query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (req.query.role) {
    query.role = req.query.role;
  }
  if (req.query.status === 'active') {
    query.isActive = true;
  } else if (req.query.status === 'suspended') {
    query.isActive = false;
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search as string, $options: 'i' };
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { username: searchRegex },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  const response: ApiResponse = {
    success: true,
    message: 'Users retrieved successfully.',
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  };

  res.status(200).json(response);
});

/**
 * GET /api/users/:id
 * Gets a single user by ID. Admin only.
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'User retrieved successfully.',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * PATCH /api/users/:id/status
 * Updates a user's isActive status (suspend/activate). Admin only.
 * Accepts { isActive: boolean, reason?: string } in the body.
 * Falls back to toggle if isActive is not provided (backwards compatible).
 */
export const updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const userId = req.params.id;
  const { isActive, reason } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;

  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive (boolean) is required.', 400);
  }

  const user = await adminService.updateUserStatus(userId, req.user.userId, isActive, reason, ipAddress);
  const statusText = user.isActive ? 'activated' : 'suspended';

  const response: ApiResponse = {
    success: true,
    message: `User ${statusText} successfully.`,
    data: { user },
  };

  res.status(200).json(response);
});
