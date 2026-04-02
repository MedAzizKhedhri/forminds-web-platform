import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as matchingService from '../services/matching.service';

export const getRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const limit = parseInt(req.query.limit as string) || 10;

  const result = await matchingService.getRecommendations(req.user.userId, limit);

  res.status(200).json({
    success: true,
    message: 'Recommendations retrieved successfully',
    data: {
      recommendations: result.recommendations,
      total: result.total,
    },
  });
});

export const getMatchScore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { opportunityId } = req.params;

  const result = await matchingService.getMatchScore(req.user.userId, opportunityId);

  res.status(200).json({
    success: true,
    message: 'Match score retrieved successfully',
    data: {
      opportunity: result.opportunity,
      matching: result.matching,
    },
  });
});
