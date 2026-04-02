import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as opportunityService from '../services/opportunity.service';

const createOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum(['stage', 'emploi', 'benevolat']),
  location: z.string().min(1),
  domain: z.string().min(1),
  skills: z.array(z.string()).optional().default([]),
  requirements: z.string().max(3000).optional(),
  deadline: z.string().optional().transform((val) => val || undefined),
});

const updateOpportunitySchema = createOpportunitySchema.partial();

export const createOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const data = createOpportunitySchema.parse(req.body);

  // Convert deadline string to Date if provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunityData: any = { ...data };
  if (data.deadline) {
    opportunityData.deadline = new Date(data.deadline);
  }

  const opportunity = await opportunityService.createOpportunity(
    req.user.userId,
    opportunityData
  );

  res.status(201).json({
    success: true,
    message: 'Opportunity created successfully',
    data: { opportunity },
  });
});

export const updateOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const data = updateOpportunitySchema.parse(req.body);
  const { opportunityId } = req.params;

  // Convert deadline string to Date if provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...data };
  if (data.deadline) {
    updateData.deadline = new Date(data.deadline);
  }

  const opportunity = await opportunityService.updateOpportunity(
    opportunityId,
    req.user.userId,
    updateData
  );

  res.status(200).json({
    success: true,
    message: 'Opportunity updated successfully',
    data: { opportunity },
  });
});

export const closeOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { opportunityId } = req.params;

  const opportunity = await opportunityService.closeOpportunity(
    opportunityId,
    req.user.userId
  );

  res.status(200).json({
    success: true,
    message: 'Opportunity closed successfully',
    data: { opportunity },
  });
});

export const reopenOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { opportunityId } = req.params;

  const opportunity = await opportunityService.reopenOpportunity(
    opportunityId,
    req.user.userId
  );

  res.status(200).json({
    success: true,
    message: 'Opportunity reopened successfully',
    data: { opportunity },
  });
});

export const deleteOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { opportunityId } = req.params;

  await opportunityService.deleteOpportunity(opportunityId, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Opportunity deleted successfully',
  });
});

export const getOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { opportunityId } = req.params;

  const opportunity = await opportunityService.getOpportunity(opportunityId);

  res.status(200).json({
    success: true,
    message: 'Opportunity retrieved successfully',
    data: { opportunity },
  });
});

export const searchOpportunities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const skills = req.query.skills
    ? (req.query.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;
  const type = req.query.type as string | undefined;
  const location = req.query.location as string | undefined;
  const domain = req.query.domain as string | undefined;

  const result = await opportunityService.searchOpportunities(
    { type, location, domain, skills },
    page,
    limit
  );

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Opportunities retrieved successfully',
    data: {
      data: result.opportunities,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getRecruiterOpportunities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await opportunityService.getRecruiterOpportunities(
    req.user.userId,
    page,
    limit
  );

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Recruiter opportunities retrieved successfully',
    data: {
      data: result.opportunities,
      total: result.total,
      page,
      totalPages,
    },
  });
});
