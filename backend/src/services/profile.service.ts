import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import StudentProfile, { IStudentProfile, IProject, IEducation, IExperience } from '../models/StudentProfile';
import RecruiterProfile, { IRecruiterProfile } from '../models/RecruiterProfile';
import User, { IUser } from '../models/User';
import Token from '../models/Token';
import Connection from '../models/Connection';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import Opportunity from '../models/Opportunity';
import Application from '../models/Application';
import AppError from '../utils/AppError';
import { UserRole } from '../utils/constants';
import config from '../config';

/**
 * Syncs and extracts skills from education, experience, and project technologies.
 * Auto-populates the main skills array with all extracted skills.
 * Deduplicates and lowercases all skills.
 */
export const syncSkillsFromAllSections = async (userId: string): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Extract skills from all sections
  const extractedSkills = new Set<string>();

  // Extract from education skills
  if (profile.education && Array.isArray(profile.education)) {
    profile.education.forEach((edu: IEducation) => {
      if (edu.skills && Array.isArray(edu.skills)) {
        edu.skills.forEach((skill: string) => {
          const normalized = skill.toLowerCase().trim();
          if (normalized) extractedSkills.add(normalized);
        });
      }
    });
  }

  // Extract from experience skills
  if (profile.experiences && Array.isArray(profile.experiences)) {
    profile.experiences.forEach((exp: IExperience) => {
      if (exp.skills && Array.isArray(exp.skills)) {
        exp.skills.forEach((skill: string) => {
          const normalized = skill.toLowerCase().trim();
          if (normalized) extractedSkills.add(normalized);
        });
      }
    });
  }

  // Extract from project technologies
  if (profile.projects && Array.isArray(profile.projects)) {
    profile.projects.forEach((proj: IProject) => {
      if (proj.technologies && Array.isArray(proj.technologies)) {
        proj.technologies.forEach((tech: string) => {
          const normalized = tech.toLowerCase().trim();
          if (normalized) extractedSkills.add(normalized);
        });
      }
    });
  }

  // Merge with existing manual skills (keeping any manually added skills)
  const currentSkills = profile.skills || [];
  const mergedSkills = new Set<string>();

  // Add current skills (in case user manually added some)
  currentSkills.forEach((skill: string) => {
    const normalized = skill.toLowerCase().trim();
    if (normalized) mergedSkills.add(normalized);
  });

  // Add extracted skills
  extractedSkills.forEach((skill: string) => mergedSkills.add(skill));

  // Convert Set to sorted array and limit to 50 skills
  const syncedSkills = Array.from(mergedSkills)
    .sort()
    .slice(0, 50);

  // Update profile with synced skills
  profile.skills = syncedSkills;
  await profile.save();

  return profile;
};

/**
 * Gets a user by ID (without password).
 */
export const getUserById = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId);
};

/**
 * Gets the profile for a user based on their role.
 * Auto-creates the profile if it doesn't exist yet.
 */
export const getProfile = async (
  userId: string,
  role: string
): Promise<IStudentProfile | IRecruiterProfile | null> => {
  if (role === UserRole.STUDENT) {
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = await StudentProfile.create({ userId });
    }
    return profile;
  }

  if (role === UserRole.RECRUITER) {
    let profile = await RecruiterProfile.findOne({ userId });
    if (!profile) {
      profile = await RecruiterProfile.create({ userId });
    }
    return profile;
  }

  if (role === UserRole.ADMIN) {
    return null;
  }

  throw new AppError('Invalid role for profile retrieval.', 400);
};

/**
 * Updates a student profile with partial data and recalculates completion.
 */
export const updateStudentProfile = async (
  userId: string,
  data: Partial<IStudentProfile>
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Recalculate completion percentage
  const user = await User.findById(userId);
  if (user) {
    profile.profileCompletionPercent = calculateProfileCompletion(profile, user);
    await profile.save();
  }

  return profile;
};

/**
 * Updates a recruiter profile with partial data.
 */
export const updateRecruiterProfile = async (
  userId: string,
  data: Partial<IRecruiterProfile>
): Promise<IRecruiterProfile> => {
  const profile = await RecruiterProfile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Recruiter profile not found.', 404);
  }

  return profile;
};

// ─────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────

/**
 * Adds a project to the student profile.
 */
export const addProject = async (
  userId: string,
  project: IProject
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $push: { projects: project } },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Sync skills from all sections (project technologies -> skills)
  const updatedProfile = await syncSkillsFromAllSections(userId);

  // Recalculate completion
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.profileCompletionPercent = calculateProfileCompletion(updatedProfile, user);
    await updatedProfile.save();
  }

  return updatedProfile;
};

/**
 * Updates a specific project in the student profile.
 */
export const updateProject = async (
  userId: string,
  projectId: string,
  data: Partial<IProject>
): Promise<IStudentProfile> => {
  const updateFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updateFields[`projects.$.${key}`] = value;
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { userId, 'projects._id': new mongoose.Types.ObjectId(projectId) },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Project not found.', 404);
  }

  // Sync skills from all sections (project technologies -> skills)
  return syncSkillsFromAllSections(userId);
};

/**
 * Removes a project from the student profile.
 */
export const removeProject = async (
  userId: string,
  projectId: string
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $pull: { projects: { _id: new mongoose.Types.ObjectId(projectId) } } },
    { new: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Sync skills from all sections
  const updatedProfile = await syncSkillsFromAllSections(userId);

  // Recalculate completion
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.profileCompletionPercent = calculateProfileCompletion(updatedProfile, user);
    await updatedProfile.save();
  }

  return updatedProfile;
};

// ─────────────────────────────────────────────────
// Education
// ─────────────────────────────────────────────────

/**
 * Adds an education entry to the student profile.
 */
export const addEducation = async (
  userId: string,
  education: IEducation
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $push: { education } },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Sync skills from all sections
  const updatedProfile = await syncSkillsFromAllSections(userId);

  // Recalculate completion
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.profileCompletionPercent = calculateProfileCompletion(updatedProfile, user);
    await updatedProfile.save();
  }

  return updatedProfile;
};

/**
 * Updates a specific education entry in the student profile.
 */
export const updateEducation = async (
  userId: string,
  educationId: string,
  data: Partial<IEducation>
): Promise<IStudentProfile> => {
  const updateFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updateFields[`education.$.${key}`] = value;
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { userId, 'education._id': new mongoose.Types.ObjectId(educationId) },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Education entry not found.', 404);
  }

  // Sync skills from all sections
  return syncSkillsFromAllSections(userId);
};

/**
 * Removes an education entry from the student profile.
 */
export const removeEducation = async (
  userId: string,
  educationId: string
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $pull: { education: { _id: new mongoose.Types.ObjectId(educationId) } } },
    { new: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Sync skills from all sections
  const updatedProfile = await syncSkillsFromAllSections(userId);

  // Recalculate completion
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.profileCompletionPercent = calculateProfileCompletion(updatedProfile, user);
    await updatedProfile.save();
  }

  return updatedProfile;
};

// ─────────────────────────────────────────────────
// Experience
// ─────────────────────────────────────────────────

/**
 * Adds an experience entry to the student profile.
 */
export const addExperience = async (
  userId: string,
  experience: IExperience
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $push: { experiences: experience } },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Sync skills from all sections
  const updatedProfile = await syncSkillsFromAllSections(userId);

  // Recalculate completion
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.profileCompletionPercent = calculateProfileCompletion(updatedProfile, user);
    await updatedProfile.save();
  }

  return updatedProfile;
};

/**
 * Updates a specific experience entry in the student profile.
 */
export const updateExperience = async (
  userId: string,
  experienceId: string,
  data: Partial<IExperience>
): Promise<IStudentProfile> => {
  const updateFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updateFields[`experiences.$.${key}`] = value;
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { userId, 'experiences._id': new mongoose.Types.ObjectId(experienceId) },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Experience entry not found.', 404);
  }

  // Sync skills from all sections
  return syncSkillsFromAllSections(userId);
};

/**
 * Removes an experience entry from the student profile.
 */
export const removeExperience = async (
  userId: string,
  experienceId: string
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $pull: { experiences: { _id: new mongoose.Types.ObjectId(experienceId) } } },
    { new: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  // Sync skills from all sections
  const updatedProfile = await syncSkillsFromAllSections(userId);

  // Recalculate completion
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.profileCompletionPercent = calculateProfileCompletion(updatedProfile, user);
    await updatedProfile.save();
  }

  return updatedProfile;
};

// ─────────────────────────────────────────────────
// CV
// ─────────────────────────────────────────────────

/**
 * Updates the CV URL on the student profile and recalculates completion.
 */
export const updateCV = async (
  userId: string,
  cvUrl: string
): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $set: { cvUrl } },
    { new: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  const user = await User.findById(userId);
  if (user) {
    profile.profileCompletionPercent = calculateProfileCompletion(profile, user);
    await profile.save();
  }

  return profile;
};

/**
 * Removes the CV reference from the student profile.
 */
export const removeCV = async (userId: string): Promise<IStudentProfile> => {
  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $set: { cvUrl: null } },
    { new: true }
  );

  if (!profile) {
    throw new AppError('Student profile not found.', 404);
  }

  const user = await User.findById(userId);
  if (user) {
    profile.profileCompletionPercent = calculateProfileCompletion(profile, user);
    await profile.save();
  }

  return profile;
};

// ─────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────

/**
 * Updates the avatar URL on the User model.
 */
export const updateAvatar = async (
  userId: string,
  avatarUrl: string
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { avatar: avatarUrl } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Recalculate student profile completion if applicable
  const studentProfile = await StudentProfile.findOne({ userId });
  if (studentProfile) {
    studentProfile.profileCompletionPercent = calculateProfileCompletion(studentProfile, user);
    await studentProfile.save();
  }

  return user;
};

/**
 * Removes the avatar from the User model.
 */
export const removeAvatar = async (userId: string): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $unset: { avatar: 1 } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const studentProfile = await StudentProfile.findOne({ userId });
  if (studentProfile) {
    studentProfile.profileCompletionPercent = calculateProfileCompletion(studentProfile, user);
    await studentProfile.save();
  }

  return user;
};

/**
 * Updates the cover image URL on the User model.
 */
export const updateCoverImage = async (
  userId: string,
  coverImageUrl: string
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { coverImage: coverImageUrl } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

/**
 * Removes the cover image from the User model.
 */
export const removeCoverImage = async (userId: string): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $unset: { coverImage: 1 } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

// ─────────────────────────────────────────────────
// Public Profile
// ─────────────────────────────────────────────────

/**
 * Gets a public profile by username. Hides sensitive fields like email and phone.
 */
export const getPublicProfile = async (
  username: string
): Promise<{ user: Partial<IUser>; profile: IStudentProfile | IRecruiterProfile }> => {
  const user = await User.findOne({ username: username.toLowerCase(), isActive: true });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  let profile: IStudentProfile | IRecruiterProfile | null = null;

  if (user.role === UserRole.STUDENT) {
    profile = await StudentProfile.findOne({ userId: user._id });
    if (profile && !(profile as IStudentProfile).isPublic) {
      throw new AppError('This profile is private.', 403);
    }
  } else if (user.role === UserRole.RECRUITER) {
    profile = await RecruiterProfile.findOne({ userId: user._id });
  }

  if (!profile) {
    throw new AppError('Profile not found.', 404);
  }

  // Build a sanitized user object via toJSON (applies avatar/coverImage URL transforms)
  const fullUser = user.toJSON();
  const publicUser = {
    _id: fullUser._id,
    firstName: fullUser.firstName,
    lastName: fullUser.lastName,
    username: fullUser.username,
    role: fullUser.role,
    avatar: fullUser.avatar,
    coverImage: fullUser.coverImage,
    createdAt: fullUser.createdAt,
  };

  return { user: publicUser, profile };
};

// ─────────────────────────────────────────────────
// Delete Account
// ─────────────────────────────────────────────────

/**
 * Permanently deletes a user account and all associated data.
 * Requires password confirmation for safety.
 */
export const deleteAccount = async (
  userId: string,
  password: string
): Promise<void> => {
  // Step 1: Verify password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Incorrect password.', 401);
  }

  // Step 2: Collect file paths to clean up after DB deletion
  const filesToDelete: string[] = [];

  if (user.avatar && user.avatar.startsWith('/')) {
    filesToDelete.push(
      path.join(config.upload.dir, user.avatar.replace('/uploads/', ''))
    );
  }
  if (user.coverImage && user.coverImage.startsWith('/')) {
    filesToDelete.push(
      path.join(config.upload.dir, user.coverImage.replace('/uploads/', ''))
    );
  }

  const studentProfile = await StudentProfile.findOne({ userId });
  if (studentProfile?.cvUrl) {
    filesToDelete.push(
      path.join(config.upload.dir, studentProfile.cvUrl.replace('/uploads/', ''))
    );
  }

  // Step 3: Find IDs for cascade deletion
  const userPosts = await Post.find({ authorId: userId }).select('_id');
  const userPostIds = userPosts.map((p) => p._id);

  const userOpportunities = await Opportunity.find({ recruiterId: userId }).select('_id');
  const userOpportunityIds = userOpportunities.map((o) => o._id);

  // Step 4a: Decrement likesCount on posts this user liked (excluding their own posts)
  const userLikes = await Like.find({
    userId,
    postId: { $nin: userPostIds },
  }).select('postId');
  const likedPostIds = userLikes.map((l) => l.postId);

  if (likedPostIds.length > 0) {
    // Group by postId to get the exact decrement per post
    const likeCounts = new Map<string, number>();
    for (const id of likedPostIds) {
      const key = id.toString();
      likeCounts.set(key, (likeCounts.get(key) || 0) + 1);
    }
    const likeUpdateOps = Array.from(likeCounts.entries()).map(([postId, count]) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(postId) },
        update: { $inc: { likesCount: -count } },
      },
    }));
    await Post.bulkWrite(likeUpdateOps);
  }

  // Step 4b: Decrement commentsCount on posts this user commented on (excluding their own posts)
  const userComments = await Comment.aggregate([
    { $match: { authorId: new mongoose.Types.ObjectId(userId), postId: { $nin: userPostIds } } },
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);

  if (userComments.length > 0) {
    const commentUpdateOps = userComments.map((entry: { _id: mongoose.Types.ObjectId; count: number }) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $inc: { commentsCount: -entry.count } },
      },
    }));
    await Post.bulkWrite(commentUpdateOps);
  }

  // Step 4c: Delete leaf documents
  await Promise.all([
    Like.deleteMany({ userId }),
    Like.deleteMany({ postId: { $in: userPostIds } }),
    Comment.deleteMany({ authorId: userId }),
    Comment.deleteMany({ postId: { $in: userPostIds } }),
    Application.deleteMany({ studentId: userId }),
  ]);

  // Step 5: Delete intermediate documents
  await Promise.all([
    Application.deleteMany({ opportunityId: { $in: userOpportunityIds } }),
    Post.deleteMany({ authorId: userId }),
    Opportunity.deleteMany({ recruiterId: userId }),
    Connection.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }),
    Token.deleteMany({ userId }),
  ]);

  // Step 6: Delete profile and user documents
  await Promise.all([
    StudentProfile.deleteOne({ userId }),
    RecruiterProfile.deleteOne({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  // Step 7: Clean up uploaded files (best-effort)
  for (const filePath of filesToDelete) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      console.error(`Failed to delete file: ${filePath}`);
    }
  }
};

// ─────────────────────────────────────────────────
// Profile Completion Calculation
// ─────────────────────────────────────────────────

/**
 * Calculates the profile completion percentage based on filled fields.
 *
 * Weights:
 * - avatar: 10%
 * - headline: 10%
 * - bio: 10%
 * - location: 5%
 * - phone: 5%
 * - skills >= 3: 15%
 * - education >= 1: 15%
 * - experiences >= 1: 15%
 * - projects >= 1: 15%
 */
export const calculateProfileCompletion = (
  profile: IStudentProfile,
  user: IUser
): number => {
  let completion = 0;

  // avatar (10%)
  if (user.avatar) {
    completion += 10;
  }

  // headline (10%)
  if (profile.headline && profile.headline.trim().length > 0) {
    completion += 10;
  }

  // bio (10%)
  if (profile.bio && profile.bio.trim().length > 0) {
    completion += 10;
  }

  // location (5%)
  if (profile.location && profile.location.trim().length > 0) {
    completion += 5;
  }

  // phone (5%)
  if (profile.phone && profile.phone.trim().length > 0) {
    completion += 5;
  }

  // skills >= 3 (15%)
  if (profile.skills && profile.skills.length >= 3) {
    completion += 15;
  }

  // education >= 1 (15%)
  if (profile.education && profile.education.length >= 1) {
    completion += 15;
  }

  // experiences >= 1 (15%)
  if (profile.experiences && profile.experiences.length >= 1) {
    completion += 15;
  }

  // projects >= 1 (15%)
  if (profile.projects && profile.projects.length >= 1) {
    completion += 15;
  }

  return completion;
};
