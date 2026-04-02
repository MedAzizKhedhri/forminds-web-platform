export enum UserRole {
  STUDENT = 'student',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
}

export enum TokenType {
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR = 'two_factor',
}

export const TOKEN_EXPIRY = {
  emailVerification: '24h',
  passwordReset: '1h',
  twoFactor: '10m',
  refreshDays: 7,
} as const;

export const ACCESS_TOKEN_EXPIRY = '15m';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum OpportunityType {
  STAGE = 'stage',
  EMPLOI = 'emploi',
  BENEVOLAT = 'benevolat',
}

export enum OpportunityStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  SHORTLISTED = 'shortlisted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum AuditAction {
  OPPORTUNITY_APPROVED = 'opportunity_approved',
  OPPORTUNITY_REJECTED = 'opportunity_rejected',
  EVENT_APPROVED = 'event_approved',
  EVENT_REJECTED = 'event_rejected',
  RECRUITER_VERIFIED = 'recruiter_verified',
  USER_SUSPENDED = 'user_suspended',
  USER_REACTIVATED = 'user_reactivated',
}

export enum EventType {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  NETWORKING = 'networking',
  WEBINAR = 'webinar',
  CAREER_FAIR = 'career_fair',
}

export enum EventStatus {
  PENDING = 'pending',
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum RegistrationStatus {
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
  CHECKED_IN = 'checked_in',
}
