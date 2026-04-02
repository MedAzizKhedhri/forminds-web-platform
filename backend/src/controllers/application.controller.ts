import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as applicationService from '../services/application.service';

const applySchema = z.object({
  opportunityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  coverLetter: z.string().max(3000).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['reviewed', 'shortlisted', 'accepted', 'rejected']),
});

export const apply = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { opportunityId, coverLetter } = applySchema.parse(req.body);

  const application = await applicationService.apply(
    req.user.userId,
    opportunityId,
    coverLetter
  );

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application },
  });
});

export const getStudentApplications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await applicationService.getStudentApplications(
    req.user.userId,
    page,
    limit
  );

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Applications retrieved successfully',
    data: {
      data: result.applications,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getOpportunityApplications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { oppId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await applicationService.getOpportunityApplications(
    oppId,
    req.user.userId,
    page,
    limit
  );

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Opportunity applications retrieved successfully',
    data: {
      data: result.applications,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getRecruiterApplications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const opportunityId = req.query.opportunityId as string | undefined;

  const result = await applicationService.getRecruiterApplications(
    req.user.userId,
    { status, search, opportunityId },
    page,
    limit
  );

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Recruiter applications retrieved successfully',
    data: {
      data: result.applications,
      total: result.total,
      page,
      totalPages,
      statusCounts: result.statusCounts,
    },
  });
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { status } = updateStatusSchema.parse(req.body);
  const { applicationId } = req.params;

  const application = await applicationService.updateApplicationStatus(
    applicationId,
    req.user.userId,
    status
  );

  res.status(200).json({
    success: true,
    message: `Application status updated to ${status}`,
    data: { application },
  });
});

export const getApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { applicationId } = req.params;

  const application = await applicationService.getApplication(applicationId);

  // Authorization: student can only view their own, recruiter can only view for their opportunities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunity = application.opportunityId as any;
  const studentId = typeof application.studentId === 'object' && application.studentId._id
    ? application.studentId._id.toString()
    : application.studentId.toString();
  const recruiterId = opportunity?.recruiterId
    ? (typeof opportunity.recruiterId === 'object' && opportunity.recruiterId._id
      ? opportunity.recruiterId._id.toString()
      : opportunity.recruiterId.toString())
    : null;

  const isOwnerStudent = req.user.userId === studentId;
  const isOwnerRecruiter = req.user.userId === recruiterId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnerStudent && !isOwnerRecruiter && !isAdmin) {
    throw new AppError('You do not have permission to view this application', 403);
  }

  res.status(200).json({
    success: true,
    message: 'Application retrieved successfully',
    data: { application },
  });
});
