import mongoose from 'mongoose';
import User from '../models/User';
import config from '../config';
import AppError from '../utils/AppError';

interface DirectoryFilters {
  skills?: string[];
  domain?: string;
  city?: string;
}

export const searchProfiles = async (
  filters: DirectoryFilters,
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ profiles: mongoose.Document[]; total: number }> => {
  const skip = (page - 1) * limit;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: mongoose.PipelineStage[] = [];

  // Match active users, exclude current user
  pipeline.push({
    $match: {
      isActive: true,
      _id: { $ne: userObjectId },
    },
  });

  // Lookup student profiles
  pipeline.push({
    $lookup: {
      from: 'studentprofiles',
      localField: '_id',
      foreignField: 'userId',
      as: 'studentProfile',
    },
  });

  // Lookup recruiter profiles
  pipeline.push({
    $lookup: {
      from: 'recruiterprofiles',
      localField: '_id',
      foreignField: 'userId',
      as: 'recruiterProfile',
    },
  });

  // Add unified profile field
  pipeline.push({
    $addFields: {
      profile: {
        $cond: {
          if: { $gt: [{ $size: '$studentProfile' }, 0] },
          then: { $arrayElemAt: ['$studentProfile', 0] },
          else: { $arrayElemAt: ['$recruiterProfile', 0] },
        },
      },
    },
  });

  // Filter: student profiles must be public
  pipeline.push({
    $match: {
      $or: [
        { role: 'recruiter' },
        { role: 'admin' },
        { 'profile.isPublic': { $ne: false } },
      ],
    },
  });

  // Filter by skills (intersection)
  if (filters.skills && filters.skills.length > 0) {
    const lowerSkills = filters.skills.map((s) => s.toLowerCase());
    pipeline.push({
      $match: {
        'profile.skills': { $in: lowerSkills },
      },
    });
  }

  // Filter by domain (regex on sector or field of study)
  if (filters.domain) {
    const domainRegex = new RegExp(filters.domain, 'i');
    pipeline.push({
      $match: {
        $or: [
          { 'profile.sector': domainRegex },
          { 'profile.education.field': domainRegex },
        ],
      },
    });
  }

  // Filter by city (regex on location)
  if (filters.city) {
    const cityRegex = new RegExp(filters.city, 'i');
    pipeline.push({
      $match: {
        'profile.location': cityRegex,
      },
    });
  }

  // Count total before pagination
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await User.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Lookup connection status between current user and each profile
  pipeline.push({
    $lookup: {
      from: 'connections',
      let: { profileUserId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                { $and: [{ $eq: ['$senderId', userObjectId] }, { $eq: ['$receiverId', '$$profileUserId'] }] },
                { $and: [{ $eq: ['$senderId', '$$profileUserId'] }, { $eq: ['$receiverId', userObjectId] }] },
              ],
            },
          },
        },
        { $limit: 1 },
      ],
      as: 'connectionInfo',
    },
  });

  // Project fields
  pipeline.push({
    $project: {
      userId: {
        _id: '$_id',
        firstName: '$firstName',
        lastName: '$lastName',
        username: '$username',
        avatar: {
          $cond: {
            if: { $and: [{ $ne: ['$avatar', null] }, { $ne: ['$avatar', ''] }] },
            then: { $concat: [config.serverUrl, '$avatar'] },
            else: null,
          },
        },
      },
      role: 1,
      headline: { $ifNull: ['$profile.headline', null] },
      location: { $ifNull: ['$profile.location', null] },
      skills: { $ifNull: ['$profile.skills', []] },
      companyName: { $ifNull: ['$profile.companyName', null] },
      sector: { $ifNull: ['$profile.sector', null] },
      connectionStatus: {
        $cond: {
          if: { $gt: [{ $size: '$connectionInfo' }, 0] },
          then: { $arrayElemAt: ['$connectionInfo.status', 0] },
          else: null,
        },
      },
    },
  });

  // Sort and paginate
  pipeline.push({ $sort: { firstName: 1, lastName: 1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const profiles = await User.aggregate(pipeline);

  return { profiles, total };
};
