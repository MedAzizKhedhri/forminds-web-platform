import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import { UserRole } from '../utils/constants';
import { ApiResponse } from '../types';
import * as profileService from '../services/profile.service';
import { IEducation, IExperience } from '../models/StudentProfile';
import config from '../config';

// ─────────────────────────────────────────────────
// Zod Validation Schemas
// ─────────────────────────────────────────────────

export const updateStudentProfileSchema = z.object({
  headline: z.string().max(120, 'Headline cannot exceed 120 characters').optional(),
  bio: z.string().max(2000, 'Bio cannot exceed 2000 characters').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  linkedinUrl: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  githubUrl: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  skills: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export const updateRecruiterProfileSchema = z.object({
  companyName: z.string().max(150, 'Company name cannot exceed 150 characters').optional(),
  sector: z.string().optional(),
  companyDescription: z.string().max(2000, 'Company description cannot exceed 2000 characters').optional(),
  companyWebsite: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  companyLogo: z.string().optional(),
  contactEmail: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  technologies: z.array(z.string()).default([]),
  link: z.string().url('Invalid URL format').optional().or(z.literal('')),
  image: z.string().optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(150, 'Institution name cannot exceed 150 characters'),
  degree: z.string().min(1, 'Degree is required').max(100, 'Degree cannot exceed 100 characters'),
  field: z.string().min(1, 'Field of study is required').max(100, 'Field cannot exceed 100 characters'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().default(false),
  skills: z.array(z.string()).optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(150, 'Company name cannot exceed 150 characters'),
  position: z.string().min(1, 'Position is required').max(100, 'Position cannot exceed 100 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().default(false),
  skills: z.array(z.string()).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// ─────────────────────────────────────────────────
// Controller Handlers
// ─────────────────────────────────────────────────

/**
 * GET /api/profiles/me
 * Returns the current user's profile based on their role.
 */
export const getMyProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const profile = await profileService.getProfile(req.user.userId, req.user.role);

  const response: ApiResponse = {
    success: true,
    message: 'Profile retrieved successfully.',
    data: { profile, role: req.user.role },
  };

  res.status(200).json(response);
});

/**
 * PUT /api/profiles/me
 * Updates the current user's profile based on their role.
 */
export const updateMyProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  let profile;

  if (req.user.role === UserRole.STUDENT) {
    const data = updateStudentProfileSchema.parse(req.body);
    profile = await profileService.updateStudentProfile(req.user.userId, data);
  } else if (req.user.role === UserRole.RECRUITER) {
    const data = updateRecruiterProfileSchema.parse(req.body);
    profile = await profileService.updateRecruiterProfile(req.user.userId, data);
  } else {
    throw new AppError('Profile update not available for this role.', 400);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Profile updated successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * POST /api/profiles/me/projects
 * Adds a project to the student profile.
 */
export const addProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const data = projectSchema.parse(req.body);
  const profile = await profileService.addProject(req.user.userId, data);

  const response: ApiResponse = {
    success: true,
    message: 'Project added successfully.',
    data: { profile },
  };

  res.status(201).json(response);
});

/**
 * PUT /api/profiles/me/projects/:id
 * Updates a specific project in the student profile.
 */
export const updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const data = projectSchema.partial().parse(req.body);
  const profile = await profileService.updateProject(req.user.userId, req.params.id, data);

  const response: ApiResponse = {
    success: true,
    message: 'Project updated successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/projects/:id
 * Removes a project from the student profile.
 */
export const deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const profile = await profileService.removeProject(req.user.userId, req.params.id);

  const response: ApiResponse = {
    success: true,
    message: 'Project removed successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * POST /api/profiles/me/education
 * Adds an education entry to the student profile.
 */
export const addEducation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const data = educationSchema.parse(req.body);
  const profile = await profileService.addEducation(req.user.userId, data as IEducation);

  const response: ApiResponse = {
    success: true,
    message: 'Education entry added successfully.',
    data: { profile },
  };

  res.status(201).json(response);
});

/**
 * PUT /api/profiles/me/education/:id
 * Updates a specific education entry in the student profile.
 */
export const updateEducation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const data = educationSchema.partial().parse(req.body);
  const profile = await profileService.updateEducation(req.user.userId, req.params.id, data as Partial<IEducation>);

  const response: ApiResponse = {
    success: true,
    message: 'Education entry updated successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/education/:id
 * Removes an education entry from the student profile.
 */
export const deleteEducation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const profile = await profileService.removeEducation(req.user.userId, req.params.id);

  const response: ApiResponse = {
    success: true,
    message: 'Education entry removed successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * POST /api/profiles/me/experiences
 * Adds an experience entry to the student profile.
 */
export const addExperience = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const data = experienceSchema.parse(req.body);
  const profile = await profileService.addExperience(req.user.userId, data as IExperience);

  const response: ApiResponse = {
    success: true,
    message: 'Experience entry added successfully.',
    data: { profile },
  };

  res.status(201).json(response);
});

/**
 * PUT /api/profiles/me/experiences/:id
 * Updates a specific experience entry in the student profile.
 */
export const updateExperience = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const data = experienceSchema.partial().parse(req.body);
  const profile = await profileService.updateExperience(req.user.userId, req.params.id, data as Partial<IExperience>);

  const response: ApiResponse = {
    success: true,
    message: 'Experience entry updated successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/experiences/:id
 * Removes an experience entry from the student profile.
 */
export const deleteExperience = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const profile = await profileService.removeExperience(req.user.userId, req.params.id);

  const response: ApiResponse = {
    success: true,
    message: 'Experience entry removed successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * POST /api/profiles/me/cv
 * Uploads a CV file for the student profile.
 */
export const uploadCV = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  if (!req.file) {
    throw new AppError('No CV file uploaded.', 400);
  }

  const cvUrl = `/uploads/cv/${req.file.filename}`;
  const profile = await profileService.updateCV(req.user.userId, cvUrl);

  const response: ApiResponse = {
    success: true,
    message: 'CV uploaded successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/cv
 * Deletes the CV file and removes the reference from the student profile.
 */
export const deleteCV = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  // Get current profile to find CV path
  const currentProfile = await profileService.getProfile(req.user.userId, UserRole.STUDENT);

  if (currentProfile && 'cvUrl' in currentProfile && currentProfile.cvUrl) {
    // Remove file from disk
    const filePath = path.join(config.upload.dir, currentProfile.cvUrl.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const profile = await profileService.removeCV(req.user.userId);

  const response: ApiResponse = {
    success: true,
    message: 'CV removed successfully.',
    data: { profile },
  };

  res.status(200).json(response);
});

/**
 * POST /api/profiles/me/avatar
 * Uploads an avatar image for the current user.
 */
export const uploadAvatar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  if (!req.file) {
    throw new AppError('No avatar file uploaded.', 400);
  }

  // Delete old avatar file if it exists
  const currentUser = await profileService.getUserById(req.user.userId);
  if (currentUser?.avatar && currentUser.avatar.startsWith('/')) {
    const oldPath = path.join(config.upload.dir, currentUser.avatar.replace('/uploads/', ''));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const user = await profileService.updateAvatar(req.user.userId, avatarUrl);

  const response: ApiResponse = {
    success: true,
    message: 'Avatar uploaded successfully.',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/avatar
 * Deletes the avatar image for the current user.
 */
export const deleteAvatar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const currentUser = await profileService.getUserById(req.user.userId);
  if (currentUser?.avatar && currentUser.avatar.startsWith('/')) {
    const filePath = path.join(config.upload.dir, currentUser.avatar.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const user = await profileService.removeAvatar(req.user.userId);

  const response: ApiResponse = {
    success: true,
    message: 'Avatar removed successfully.',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * POST /api/profiles/me/cover
 * Uploads a cover image for the current user.
 */
export const uploadCover = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  if (!req.file) {
    throw new AppError('No cover image uploaded.', 400);
  }

  // Delete old cover file if it exists
  const currentUser = await profileService.getUserById(req.user.userId);
  if (currentUser?.coverImage && currentUser.coverImage.startsWith('/')) {
    const oldPath = path.join(config.upload.dir, currentUser.coverImage.replace('/uploads/', ''));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const coverUrl = `/uploads/covers/${req.file.filename}`;
  const user = await profileService.updateCoverImage(req.user.userId, coverUrl);

  const response: ApiResponse = {
    success: true,
    message: 'Cover image uploaded successfully.',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/cover
 * Deletes the cover image for the current user.
 */
export const deleteCover = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const currentUser = await profileService.getUserById(req.user.userId);
  if (currentUser?.coverImage && currentUser.coverImage.startsWith('/')) {
    const filePath = path.join(config.upload.dir, currentUser.coverImage.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const user = await profileService.removeCoverImage(req.user.userId);

  const response: ApiResponse = {
    success: true,
    message: 'Cover image removed successfully.',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * GET /api/profiles/public/:username
 * Gets a public profile by username. No authentication required.
 */
export const getPublicProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;

  const result = await profileService.getPublicProfile(username);

  const response: ApiResponse = {
    success: true,
    message: 'Public profile retrieved successfully.',
    data: result,
  };

  res.status(200).json(response);
});

/**
 * DELETE /api/profiles/me/account
 * Permanently deletes the authenticated user's account and all associated data.
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { password } = deleteAccountSchema.parse(req.body);

  await profileService.deleteAccount(req.user.userId, password);

  const response: ApiResponse = {
    success: true,
    message: 'Account deleted successfully.',
  };

  res.status(200).json(response);
});
