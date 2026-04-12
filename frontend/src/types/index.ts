export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'student' | 'recruiter' | 'admin';
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  isActive: boolean;
  avatar?: string;
  coverImage?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  image?: string;
}

export interface Education {
  _id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  skills?: string[];
}

export interface Experience {
  _id: string;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  skills?: string[];
}

export interface StudentProfile {
  _id: string;
  userId: string;
  headline?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills: string[];
  education: Education[];
  experiences: Experience[];
  projects: Project[];
  cvUrl?: string;
  profileCompletionPercent: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterProfile {
  _id: string;
  userId: string;
  companyName: string;
  sector: string;
  companyDescription?: string;
  companyWebsite?: string;
  companyLogo?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

// === Sprint 2 — Pagination ===
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// === Sprint 2 — BF-003: Connections ===
export interface Connection {
  _id: string;
  senderId: string | User;
  receiverId: string | User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// === Sprint 2 — BF-003: Social Feed ===
export interface Post {
  _id: string;
  authorId: User;
  content: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  authorId: User;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// === Sprint 2 — BF-004: Opportunities ===
export interface Opportunity {
  _id: string;
  recruiterId: User | string;
  title: string;
  description: string;
  type: 'stage' | 'emploi' | 'benevolat';
  location: string;
  domain: string;
  skills: string[];
  requirements?: string;
  deadline?: string;
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// === Sprint 2 — BF-004: Applications ===
export interface Application {
  _id: string;
  studentId: User | string;
  opportunityId: Opportunity | string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string;
}

// === Sprint 4 — BF-007: Administration ===
export interface AdminStats {
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

export interface AuditLog {
  _id: string;
  adminId: User;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// === Sprint 3 — BF-006: Events ===
export interface Event {
  _id: string;
  organizerId: User | string;
  title: string;
  description: string;
  type: 'conference' | 'workshop' | 'networking' | 'webinar' | 'career_fair';
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  isOnline: boolean;
  meetingUrl?: string;
  image?: string;
  status: 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  _id: string;
  eventId: Event | string;
  userId: User | string;
  status: 'registered' | 'cancelled' | 'checked_in';
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
}

// === Sprint 3 — BF-005: AI Matching ===
export interface MatchBreakdown {
  skillsScore: number;
  locationScore: number;
  domainScore: number;
  experienceScore?: number;
}

export interface MatchResult {
  opportunity: Opportunity;
  score: number;
  breakdown: MatchBreakdown;
  explanation: string;
}

export interface DetailedMatchResult {
  overallScore: number;
  breakdown: MatchBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

// === Notifications ===
export type NotificationType =
  | 'application_status_update'
  | 'connection_request'
  | 'connection_accepted'
  | 'event_update'
  | 'event_reminder'
  | 'new_application'
  | 'recruiter_verified'
  | 'opportunity_approved'
  | 'opportunity_rejected'
  | 'event_approved'
  | 'event_rejected'
  | 'new_pending_opportunity'
  | 'new_pending_event'
  | 'new_recruiter_registration';

export interface Notification {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: {
    entityType?: 'application' | 'opportunity' | 'event' | 'connection' | 'user';
    entityId?: string;
    actionUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
