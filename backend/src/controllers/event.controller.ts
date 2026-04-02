import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as eventService from '../services/event.service';
import { EventType } from '../utils/constants';

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.nativeEnum(EventType),
  location: z.string().min(1),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  capacity: z.number().int().min(1),
  isOnline: z.boolean().optional(),
  meetingUrl: z.string().url().optional(),
  image: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

const checkinSchema = z.object({
  qrCode: z.string().min(1),
});

export const createEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const data = createEventSchema.parse(req.body);

  const event = await eventService.createEvent(req.user.userId, {
    ...data,
    date: new Date(data.date),
  } as never);

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: { event },
  });
});

export const updateEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;
  const data = updateEventSchema.parse(req.body);

  const updateData = {
    ...data,
    ...(data.date ? { date: new Date(data.date) } : {}),
  };

  const event = await eventService.updateEvent(eventId, req.user.userId, updateData as never);

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: { event },
  });
});

export const cancelEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;

  const event = await eventService.cancelEvent(eventId, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Event cancelled successfully',
    data: { event },
  });
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;

  await eventService.deleteEvent(eventId, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
  });
});

export const getEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { eventId } = req.params;

  const event = await eventService.getEvent(eventId);

  res.status(200).json({
    success: true,
    message: 'Event retrieved successfully',
    data: { event },
  });
});

export const listEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await eventService.listEvents({ type, status, search }, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Events retrieved successfully',
    data: {
      events: result.events,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getOrganizerEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await eventService.getOrganizerEvents(req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Organizer events retrieved successfully',
    data: {
      events: result.events,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const registerForEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;

  const registration = await eventService.registerForEvent(eventId, req.user.userId);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { registration },
  });
});

export const cancelRegistration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;

  await eventService.cancelRegistration(eventId, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Registration cancelled successfully',
  });
});

export const getMyRegistration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;

  const registration = await eventService.getMyRegistration(eventId, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Registration retrieved successfully',
    data: { registration },
  });
});

export const checkin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;
  const { qrCode } = checkinSchema.parse(req.body);

  const registration = await eventService.checkinByQR(eventId, qrCode, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Check-in successful',
    data: { registration },
  });
});

export const getEventParticipants = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { eventId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await eventService.getEventParticipants(eventId, req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Participants retrieved successfully',
    data: {
      participants: result.participants,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getUserRegistrations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await eventService.getUserRegistrations(req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Registrations retrieved successfully',
    data: {
      registrations: result.registrations,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const uploadEventImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (!req.file) {
    throw new AppError('No image file uploaded.', 400);
  }

  const imageUrl = `/uploads/events/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Event image uploaded successfully',
    data: { imageUrl },
  });
});
