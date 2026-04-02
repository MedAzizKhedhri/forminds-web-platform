import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as connectionService from '../services/connection.service';

const sendRequestSchema = z.object({
  receiverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
});

const respondRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export const sendRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { receiverId } = sendRequestSchema.parse(req.body);

  const connection = await connectionService.sendRequest(req.user.userId, receiverId);

  res.status(201).json({
    success: true,
    message: 'Connection request sent successfully',
    data: { connection },
  });
});

export const respondToRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { status } = respondRequestSchema.parse(req.body);
  const { connectionId } = req.params;

  const connection = await connectionService.respondToRequest(
    connectionId,
    req.user.userId,
    status
  );

  res.status(200).json({
    success: true,
    message: `Connection request ${status}`,
    data: { connection },
  });
});

export const getConnections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await connectionService.getConnections(req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Connections retrieved successfully',
    data: {
      data: result.connections,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getPendingRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await connectionService.getPendingRequests(req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Pending requests retrieved successfully',
    data: {
      data: result.connections,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getSentRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await connectionService.getSentRequests(req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Sent requests retrieved successfully',
    data: {
      data: result.connections,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getSuggestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const limit = parseInt(req.query.limit as string) || 10;

  const suggestions = await connectionService.getSuggestions(req.user.userId, limit);

  res.status(200).json({
    success: true,
    message: 'Suggestions retrieved successfully',
    data: { suggestions },
  });
});

export const removeConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { connectionId } = req.params;

  await connectionService.removeConnection(connectionId, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Connection removed successfully',
  });
});

export const getConnectionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { userId } = req.params;

  const result = await connectionService.getConnectionStatus(req.user.userId, userId);

  res.status(200).json({
    success: true,
    message: 'Connection status retrieved successfully',
    data: result,
  });
});
