import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as directoryService from '../services/directory.service';

export const searchProfiles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const skills = req.query.skills
    ? (req.query.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;
  const domain = req.query.domain as string | undefined;
  const city = req.query.city as string | undefined;

  const result = await directoryService.searchProfiles(
    { skills, domain, city },
    req.user.userId,
    page,
    limit
  );

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Profiles retrieved successfully',
    data: {
      data: result.profiles,
      total: result.total,
      page,
      totalPages,
    },
  });
});
