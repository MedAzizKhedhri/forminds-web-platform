import { v4 as uuidv4 } from 'uuid';
import Event, { IEvent } from '../models/Event';
import Registration, { IRegistration } from '../models/Registration';
import User from '../models/User';
import AppError from '../utils/AppError';
import { EventStatus, RegistrationStatus, UserRole } from '../utils/constants';
import * as emailService from './email.service';

export const createEvent = async (
  organizerId: string,
  data: Partial<IEvent>
): Promise<IEvent> => {
  const event = await Event.create({
    ...data,
    organizerId,
    registeredCount: 0,
    status: EventStatus.PENDING,
  });

  return event;
};

export const updateEvent = async (
  eventId: string,
  organizerId: string,
  data: Partial<IEvent>
): Promise<IEvent> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Only the organizer can update their event
  if (event.organizerId.toString() !== organizerId) {
    throw new AppError('You can only update your own events', 403);
  }

  if (event.status === EventStatus.CANCELLED) {
    throw new AppError('Cannot update a cancelled event', 400);
  }

  Object.assign(event, data);
  await event.save();

  return event;
};

export const cancelEvent = async (
  eventId: string,
  organizerId: string
): Promise<IEvent> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Only the organizer can cancel their event
  if (event.organizerId.toString() !== organizerId) {
    throw new AppError('You can only cancel your own events', 403);
  }

  if (event.status === EventStatus.CANCELLED) {
    throw new AppError('Event is already cancelled', 400);
  }

  event.status = EventStatus.CANCELLED;
  await event.save();

  // Cancel all active registrations and notify participants
  const registrations = await Registration.find({
    eventId,
    status: RegistrationStatus.REGISTERED,
  }).populate('userId', 'email firstName');

  for (const reg of registrations) {
    reg.status = RegistrationStatus.CANCELLED;
    await reg.save();

    const regUser = reg.userId as unknown as { email: string; firstName: string } | null;
    if (regUser?.email) {
      try {
        await emailService.sendEventCancellationNotification(
          regUser.email,
          regUser.firstName,
          event.title
        );
      } catch {
        console.error(`[Email] Failed to send cancellation notification to ${regUser.email}`);
      }
    }
  }

  return event;
};

export const deleteEvent = async (
  eventId: string,
  organizerId: string
): Promise<void> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.organizerId.toString() !== organizerId) {
    throw new AppError('You can only delete your own events', 403);
  }

  if (event.status !== EventStatus.CANCELLED) {
    throw new AppError('Only cancelled events can be deleted', 400);
  }

  // Delete all registrations for this event
  await Registration.deleteMany({ eventId });

  // Delete the event
  await Event.findByIdAndDelete(eventId);
};

export const getEvent = async (eventId: string): Promise<IEvent> => {
  const event = await Event.findById(eventId).populate(
    'organizerId',
    'firstName lastName username avatar'
  );

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
};

export const listEvents = async (
  filters: {
    type?: string;
    status?: string;
    search?: string;
  },
  page: number = 1,
  limit: number = 20
): Promise<{ events: IEvent[]; total: number }> => {
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.status) {
    query.status = filters.status;
  } else {
    // By default show only upcoming events (exclude pending)
    query.status = EventStatus.UPCOMING;
  }

  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { location: new RegExp(filters.search, 'i') },
    ];
  }

  const [events, total] = await Promise.all([
    Event.find(query)
      .populate('organizerId', 'firstName lastName username avatar')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(query),
  ]);

  return { events, total };
};

export const getOrganizerEvents = async (
  organizerId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ events: IEvent[]; total: number }> => {
  const skip = (page - 1) * limit;

  // Only return events for this organizer (recruiter)
  const query = { organizerId };

  const [events, total] = await Promise.all([
    Event.find(query)
      .populate('organizerId', 'firstName lastName username avatar')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(query),
  ]);

  return { events, total };
};

export const registerForEvent = async (
  eventId: string,
  userId: string
): Promise<IRegistration> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.status !== EventStatus.UPCOMING) {
    throw new AppError('Event is not open for registration', 400);
  }

  if (new Date(event.date) < new Date()) {
    throw new AppError('Event has already passed', 400);
  }

  const existing = await Registration.findOne({ eventId, userId });
  if (existing) {
    if (existing.status === RegistrationStatus.CANCELLED) {
      // Re-register: reactivate the cancelled registration
      if (event.registeredCount >= event.capacity) {
        throw new AppError('Event is full', 400);
      }
      existing.status = RegistrationStatus.REGISTERED;
      existing.qrCode = uuidv4();
      existing.checkedIn = false;
      existing.checkedInAt = undefined;
      await existing.save();

      event.registeredCount += 1;
      await event.save();

      // Send confirmation email
      const user = await User.findById(userId, 'email firstName');
      if (user) {
        const dateStr = event.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        try {
          await emailService.sendEventRegistrationConfirmation(
            user.email,
            user.firstName,
            event.title,
            dateStr,
            existing.qrCode
          );
        } catch {
          console.error(`[Email] Failed to send registration confirmation to ${user.email}`);
        }
      }

      return existing;
    }
    throw new AppError('Already registered for this event', 409);
  }

  if (event.registeredCount >= event.capacity) {
    throw new AppError('Event is full', 400);
  }

  const qrCode = uuidv4();

  const registration = await Registration.create({
    eventId,
    userId,
    status: RegistrationStatus.REGISTERED,
    qrCode,
    checkedIn: false,
  });

  event.registeredCount += 1;
  await event.save();

  // Send confirmation email
  const user = await User.findById(userId, 'email firstName');
  if (user) {
    const dateStr = event.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    try {
      await emailService.sendEventRegistrationConfirmation(
        user.email,
        user.firstName,
        event.title,
        dateStr,
        qrCode
      );
    } catch {
      console.error(`[Email] Failed to send registration confirmation to ${user.email}`);
    }
  }

  return registration;
};

export const cancelRegistration = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const registration = await Registration.findOne({ eventId, userId });
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  if (registration.status === RegistrationStatus.CANCELLED) {
    throw new AppError('Registration is already cancelled', 400);
  }

  if (registration.status === RegistrationStatus.CHECKED_IN) {
    throw new AppError('Cannot cancel a registration after check-in', 400);
  }

  registration.status = RegistrationStatus.CANCELLED;
  await registration.save();

  await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
};

export const getMyRegistration = async (
  eventId: string,
  userId: string
): Promise<IRegistration> => {
  const registration = await Registration.findOne({ eventId, userId })
    .populate('eventId', 'title date startTime endTime location isOnline');

  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  return registration;
};

export const checkinByQR = async (
  eventId: string,
  qrCode: string,
  organizerId: string
): Promise<IRegistration> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Only the organizer can check-in participants
  if (event.organizerId.toString() !== organizerId) {
    throw new AppError('Forbidden', 403);
  }

  const registration = await Registration.findOne({ eventId, qrCode });
  if (!registration) {
    throw new AppError('Invalid QR code', 404);
  }

  if (registration.checkedIn) {
    throw new AppError('Already checked in', 409);
  }

  registration.checkedIn = true;
  registration.checkedInAt = new Date();
  registration.status = RegistrationStatus.CHECKED_IN;
  await registration.save();

  await registration.populate('userId', 'firstName lastName avatar');

  return registration;
};

export const getEventParticipants = async (
  eventId: string,
  organizerId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ participants: IRegistration[]; total: number }> => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Only the organizer can view participants
  if (event.organizerId.toString() !== organizerId) {
    throw new AppError('Forbidden', 403);
  }

  const skip = (page - 1) * limit;

  const query = { eventId, status: { $ne: RegistrationStatus.CANCELLED } };

  const [participants, total] = await Promise.all([
    Registration.find(query)
      .populate('userId', 'firstName lastName username avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments(query),
  ]);

  return { participants, total };
};

export const getUserRegistrations = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ registrations: IRegistration[]; total: number }> => {
  const skip = (page - 1) * limit;

  const query = { userId, status: { $ne: RegistrationStatus.CANCELLED } };

  const [registrations, total] = await Promise.all([
    Registration.find(query)
      .populate({
        path: 'eventId',
        select: 'title date startTime endTime location isOnline type status organizerId',
        populate: {
          path: 'organizerId',
          select: 'firstName lastName username avatar',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments(query),
  ]);

  return { registrations, total };
};
