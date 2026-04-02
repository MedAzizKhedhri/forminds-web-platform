import mongoose from 'mongoose';
import User from '../models/User';
import Opportunity from '../models/Opportunity';
import Application from '../models/Application';
import Event from '../models/Event';
import RecruiterProfile from '../models/RecruiterProfile';
import AppError from '../utils/AppError';
import { OpportunityStatus, EventStatus, AuditAction, UserRole } from '../utils/constants';
import * as auditService from './audit.service';
import * as emailService from './email.service';

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalRecruiters: number;
  suspendedUsers: number;
  pendingOpportunities: number;
  approvedOpportunities: number;
  rejectedOpportunities: number;
  totalApplications: number;
  newUsersLast30Days: number;
  pendingEvents: number;
}

export const getStats = async (): Promise<DashboardStats> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    totalStudents,
    totalRecruiters,
    suspendedUsers,
    pendingOpportunities,
    approvedOpportunities,
    rejectedOpportunities,
    totalApplications,
    newUsersLast30Days,
    pendingEvents,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: UserRole.STUDENT }),
    User.countDocuments({ role: UserRole.RECRUITER }),
    User.countDocuments({ isActive: false }),
    Opportunity.countDocuments({ status: OpportunityStatus.PENDING }),
    Opportunity.countDocuments({ status: OpportunityStatus.APPROVED }),
    Opportunity.countDocuments({ status: OpportunityStatus.REJECTED }),
    Application.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Event.countDocuments({ status: EventStatus.PENDING }),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalRecruiters,
    suspendedUsers,
    pendingOpportunities,
    approvedOpportunities,
    rejectedOpportunities,
    totalApplications,
    newUsersLast30Days,
    pendingEvents,
  };
};

export const getPendingOpportunities = async (
  page: number = 1,
  limit: number = 20
): Promise<{ opportunities: typeof Opportunity extends new () => infer T ? T[] : never; total: number }> => {
  const skip = (page - 1) * limit;

  const [opportunities, total] = await Promise.all([
    Opportunity.find({ status: OpportunityStatus.PENDING })
      .populate('recruiterId', 'firstName lastName username avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Opportunity.countDocuments({ status: OpportunityStatus.PENDING }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { opportunities: opportunities as any, total };
};

export const validateOpportunity = async (
  opportunityId: string,
  adminId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
  ipAddress?: string
) => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found.', 404);
  }

  if (opportunity.status !== OpportunityStatus.PENDING) {
    throw new AppError('Opportunity has already been processed.', 400);
  }

  opportunity.status = status === 'approved' ? OpportunityStatus.APPROVED : OpportunityStatus.REJECTED;
  opportunity.reviewedBy = new mongoose.Types.ObjectId(adminId);
  opportunity.reviewedAt = new Date();
  if (status === 'rejected' && rejectionReason) {
    opportunity.rejectionReason = rejectionReason;
  }
  await opportunity.save();

  // Log audit action
  const auditAction = status === 'approved'
    ? AuditAction.OPPORTUNITY_APPROVED
    : AuditAction.OPPORTUNITY_REJECTED;

  await auditService.logAction(
    adminId,
    auditAction,
    'Opportunity',
    opportunityId,
    { status, rejectionReason },
    ipAddress
  );

  // Send email notification to recruiter
  try {
    const recruiter = await User.findById(opportunity.recruiterId);
    if (recruiter) {
      await emailService.sendOpportunityValidationNotification(
        recruiter.email,
        recruiter.firstName,
        opportunity.title,
        status,
        rejectionReason
      );
    }
  } catch {
    // Email failure should not block the response
    console.error('[Admin] Failed to send opportunity validation email');
  }

  return opportunity;
};

export const getUnverifiedRecruiters = async (
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [recruiters, total] = await Promise.all([
    RecruiterProfile.find({ isVerified: false })
      .populate('userId', 'firstName lastName email avatar createdAt')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    RecruiterProfile.countDocuments({ isVerified: false }),
  ]);

  return { recruiters, total };
};

export const verifyRecruiter = async (
  userId: string,
  adminId: string,
  ipAddress?: string
) => {
  const profile = await RecruiterProfile.findOne({ userId });
  if (!profile) {
    throw new AppError('Recruiter profile not found.', 404);
  }

  if (profile.isVerified) {
    throw new AppError('Recruiter is already verified.', 400);
  }

  profile.isVerified = true;
  await profile.save();

  // Log audit action
  await auditService.logAction(
    adminId,
    AuditAction.RECRUITER_VERIFIED,
    'User',
    userId,
    undefined,
    ipAddress
  );

  // Send email notification
  try {
    const user = await User.findById(userId);
    if (user) {
      await emailService.sendRecruiterVerificationNotification(user.email, user.firstName);
    }
  } catch {
    console.error('[Admin] Failed to send recruiter verification email');
  }

  return profile;
};

export const updateUserStatus = async (
  userId: string,
  adminId: string,
  isActive: boolean,
  reason?: string,
  ipAddress?: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role === UserRole.ADMIN) {
    throw new AppError('Cannot modify an admin account.', 403);
  }

  user.isActive = isActive;
  await user.save();

  // Log audit action
  const auditAction = isActive
    ? AuditAction.USER_REACTIVATED
    : AuditAction.USER_SUSPENDED;

  await auditService.logAction(
    adminId,
    auditAction,
    'User',
    userId,
    { reason },
    ipAddress
  );

  // Send email notification
  try {
    if (isActive) {
      await emailService.sendAccountReactivationNotification(user.email, user.firstName);
    } else {
      await emailService.sendAccountSuspensionNotification(user.email, user.firstName, reason || 'No reason provided');
    }
  } catch {
    console.error('[Admin] Failed to send user status email');
  }

  return user;
};

export const getPendingEvents = async (
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find({ status: EventStatus.PENDING })
      .populate('organizerId', 'firstName lastName username avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments({ status: EventStatus.PENDING }),
  ]);

  return { events, total };
};

export const validateEvent = async (
  eventId: string,
  adminId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
  ipAddress?: string
) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found.', 404);
  }

  if (event.status !== EventStatus.PENDING) {
    throw new AppError('Event has already been processed.', 400);
  }

  event.status = status === 'approved' ? EventStatus.UPCOMING : EventStatus.REJECTED;
  await event.save();

  const auditAction = status === 'approved'
    ? AuditAction.EVENT_APPROVED
    : AuditAction.EVENT_REJECTED;

  await auditService.logAction(
    adminId,
    auditAction,
    'Event',
    eventId,
    { status, rejectionReason },
    ipAddress
  );

  // Email notification to organizer
  try {
    const organizer = await User.findById(event.organizerId);
    if (organizer) {
      await emailService.sendEventValidationNotification(
        organizer.email,
        organizer.firstName,
        event.title,
        status,
        rejectionReason
      );
    }
  } catch {
    console.error('[Admin] Failed to send event validation email');
  }

  return event;
};
