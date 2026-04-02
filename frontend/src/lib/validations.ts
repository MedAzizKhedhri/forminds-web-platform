import { z } from 'zod';

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-z0-9_-]+$/,
        'Username can only contain lowercase letters, numbers, hyphens, and underscores'
      ),
    role: z.enum(['student', 'recruiter'], {
      required_error: 'Please select a role',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    email: z.string().email('Invalid email address'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const twoFactorSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

// --- Profile Schemas ---

export const studentProfileSchema = z.object({
  headline: z.string().max(120, 'Headline must be at most 120 characters').optional(),
  bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  linkedinUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  githubUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  skills: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

export const recruiterProfileSchema = z.object({
  companyName: z.string().optional(),
  sector: z.string().optional(),
  companyDescription: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  companyWebsite: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  contactEmail: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
});

export type RecruiterProfileFormData = z.infer<typeof recruiterProfileSchema>;

// --- Project / Education / Experience Schemas ---

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  technologies: z.array(z.string()).optional(),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean(),
});

export type EducationFormData = z.infer<typeof educationSchema>;

export const experienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean(),
});

export type ExperienceFormData = z.infer<typeof experienceSchema>;

// --- Sprint 2: Opportunity Schemas ---

export const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  type: z.enum(['stage', 'emploi', 'benevolat']),
  location: z.string().min(1, 'Location is required'),
  domain: z.string().min(1, 'Domain is required'),
  skills: z.array(z.string()).optional().default([]),
  requirements: z.string().max(3000).optional(),
  deadline: z.string().optional(),
});

export type CreateOpportunityFormData = z.infer<typeof createOpportunitySchema>;

// --- Sprint 2: Post Schemas ---

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

// --- Sprint 2: Comment Schemas ---

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(1000),
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;

// --- Sprint 2: Application Schemas ---

export const applySchema = z.object({
  opportunityId: z.string().min(1),
  coverLetter: z.string().max(3000).optional(),
});

export type ApplyFormData = z.infer<typeof applySchema>;

// --- Sprint 3: Event Schemas ---

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  type: z.enum(['conference', 'workshop', 'networking', 'webinar', 'career_fair']),
  location: z.string().min(2, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  isOnline: z.boolean(),
  meetingUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  image: z.string().optional(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
