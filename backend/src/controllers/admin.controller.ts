import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as adminService from '../services/admin.service';
import * as auditService from '../services/audit.service';
import { ApiResponse } from '../types';

const validateOpportunitySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(1000).optional(),
});

const validateEventSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(1000).optional(),
});

/**
 * GET /api/admin/stats
 * Returns dashboard KPIs. Admin only.
 */
export const getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stats = await adminService.getStats();

  const response: ApiResponse = {
    success: true,
    message: 'Dashboard stats retrieved successfully.',
    data: { stats },
  };

  res.status(200).json(response);
});

/**
 * GET /api/admin/opportunities
 * Lists pending opportunities for admin review. Admin only.
 */
export const getPendingOpportunities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

  const result = await adminService.getPendingOpportunities(page, limit);
  const totalPages = Math.ceil(result.total / limit);

  const response: ApiResponse = {
    success: true,
    message: 'Pending opportunities retrieved successfully.',
    data: {
      opportunities: result.opportunities,
      pagination: { page, limit, total: result.total, totalPages },
    },
  };

  res.status(200).json(response);
});

/**
 * PATCH /api/admin/opportunities/:opportunityId
 * Approves or rejects an opportunity. Admin only.
 */
export const validateOpportunity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const data = validateOpportunitySchema.parse(req.body);
  const { opportunityId } = req.params;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;

  const opportunity = await adminService.validateOpportunity(
    opportunityId,
    req.user.userId,
    data.status,
    data.rejectionReason,
    ipAddress
  );

  const statusText = data.status === 'approved' ? 'approved' : 'rejected';

  const response: ApiResponse = {
    success: true,
    message: `Opportunity ${statusText} successfully.`,
    data: { opportunity },
  };

  res.status(200).json(response);
});

/**
 * GET /api/admin/recruiters
 * Lists unverified recruiters. Admin only.
 */
export const getUnverifiedRecruiters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

  const result = await adminService.getUnverifiedRecruiters(page, limit);
  const totalPages = Math.ceil(result.total / limit);

  const response: ApiResponse = {
    success: true,
    message: 'Unverified recruiters retrieved successfully.',
    data: {
      recruiters: result.recruiters,
      pagination: { page, limit, total: result.total, totalPages },
    },
  };

  res.status(200).json(response);
});

/**
 * PATCH /api/admin/recruiters/:userId/verify
 * Verifies a recruiter. Admin only.
 */
export const verifyRecruiter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { userId } = req.params;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;

  const profile = await adminService.verifyRecruiter(userId, req.user.userId, ipAddress);

  const response: ApiResponse = {
    success: true,
    message: 'Recruiter verified successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * GET /api/admin/audit-log
 * Lists audit logs with optional filters. Admin only.
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));

  const filters = {
    action: req.query.action as string | undefined,
    adminId: req.query.adminId as string | undefined,
    targetType: req.query.targetType as string | undefined,
  };

  const result = await auditService.getAuditLogs(filters, page, limit);
  const totalPages = Math.ceil(result.total / limit);

  const response: ApiResponse = {
    success: true,
    message: 'Audit logs retrieved successfully.',
    data: {
      logs: result.logs,
      pagination: { page, limit, total: result.total, totalPages },
    },
  };

  res.status(200).json(response);
});

/**
 * GET /api/admin/events
 * Lists pending events for admin review. Admin only.
 */
export const getPendingEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

  const result = await adminService.getPendingEvents(page, limit);
  const totalPages = Math.ceil(result.total / limit);

  const response: ApiResponse = {
    success: true,
    message: 'Pending events retrieved successfully.',
    data: {
      events: result.events,
      pagination: { page, limit, total: result.total, totalPages },
    },
  };

  res.status(200).json(response);
});

/**
 * PATCH /api/admin/events/:eventId
 * Approves or rejects an event. Admin only.
 */
export const validateEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const data = validateEventSchema.parse(req.body);
  const { eventId } = req.params;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;

  const event = await adminService.validateEvent(
    eventId,
    req.user.userId,
    data.status,
    data.rejectionReason,
    ipAddress
  );

  const statusText = data.status === 'approved' ? 'approved' : 'rejected';

  const response: ApiResponse = {
    success: true,
    message: `Event ${statusText} successfully.`,
    data: { event },
  };

  res.status(200).json(response);
});
