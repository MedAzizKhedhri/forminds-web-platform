import mongoose from 'mongoose';
import Connection, { IConnection } from '../models/Connection';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import RecruiterProfile from '../models/RecruiterProfile';
import AppError from '../utils/AppError';
import { ConnectionStatus } from '../utils/constants';
import config from '../config';

export const sendRequest = async (
  senderId: string,
  receiverId: string
): Promise<IConnection> => {
  if (senderId === receiverId) {
    throw new AppError('You cannot send a connection request to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver || !receiver.isActive) {
    throw new AppError('User not found or inactive', 404);
  }

  const existing = await Connection.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });

  if (existing) {
    if (existing.status === ConnectionStatus.REJECTED) {
      // Allow re-requesting after a previous rejection
      await Connection.findByIdAndDelete(existing._id);
    } else if (existing.status === ConnectionStatus.PENDING) {
      // Already pending — return the existing request
      return existing;
    } else {
      throw new AppError('You are already connected with this user', 409);
    }
  }

  const connection = await Connection.create({
    senderId,
    receiverId,
    status: ConnectionStatus.PENDING,
  });

  return connection;
};

export const respondToRequest = async (
  connectionId: string,
  userId: string,
  status: 'accepted' | 'rejected'
): Promise<IConnection> => {
  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new AppError('Connection request not found', 404);
  }

  if (connection.receiverId.toString() !== userId) {
    throw new AppError('You can only respond to requests sent to you', 403);
  }

  if (connection.status !== ConnectionStatus.PENDING) {
    throw new AppError('This request has already been processed', 400);
  }

  connection.status = status as ConnectionStatus;
  await connection.save();

  return connection;
};

export const getConnections = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ connections: IConnection[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = {
    status: ConnectionStatus.ACCEPTED,
    $or: [{ senderId: userId }, { receiverId: userId }],
  };

  const [connections, total] = await Promise.all([
    Connection.find(filter)
      .populate('senderId', 'firstName lastName username avatar role')
      .populate('receiverId', 'firstName lastName username avatar role')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Connection.countDocuments(filter),
  ]);

  return { connections, total };
};

export const getPendingRequests = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ connections: IConnection[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = {
    receiverId: userId,
    status: ConnectionStatus.PENDING,
  };

  const [connections, total] = await Promise.all([
    Connection.find(filter)
      .populate('senderId', 'firstName lastName username avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Connection.countDocuments(filter),
  ]);

  return { connections, total };
};

export const getSentRequests = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ connections: IConnection[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = {
    senderId: userId,
    status: ConnectionStatus.PENDING,
  };

  const [connections, total] = await Promise.all([
    Connection.find(filter)
      .populate('receiverId', 'firstName lastName username avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Connection.countDocuments(filter),
  ]);

  return { connections, total };
};

export const getSuggestions = async (
  userId: string,
  limit: number = 10
): Promise<mongoose.Document[]> => {
  // Get existing connection user IDs to exclude (includes old-format requesterId/addresseeId)
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const existingConnections = await mongoose.connection.db!
    .collection('connections')
    .find({
      $or: [
        { senderId: userObjectId },
        { receiverId: userObjectId },
        { requesterId: userObjectId },
        { addresseeId: userObjectId },
      ],
    })
    .project({ senderId: 1, receiverId: 1, requesterId: 1, addresseeId: 1 })
    .toArray();

  const excludeIds = new Set<string>();
  excludeIds.add(userId);
  for (const conn of existingConnections) {
    if (conn.senderId) excludeIds.add(conn.senderId.toString());
    if (conn.receiverId) excludeIds.add(conn.receiverId.toString());
    if (conn.requesterId) excludeIds.add(conn.requesterId.toString());
    if (conn.addresseeId) excludeIds.add(conn.addresseeId.toString());
  }

  const excludeObjectIds = Array.from(excludeIds).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // Get current user's profile for skill matching
  const studentProfile = await StudentProfile.findOne({ userId: userObjectId });
  const recruiterProfile = await RecruiterProfile.findOne({ userId: userObjectId });

  const userSkills = studentProfile?.skills || [];
  const userSector = recruiterProfile?.sector || '';

  // Find active users not already connected
  const suggestions = await User.aggregate([
    {
      $match: {
        _id: { $nin: excludeObjectIds },
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'studentprofiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'studentProfile',
      },
    },
    {
      $lookup: {
        from: 'recruiterprofiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'recruiterProfile',
      },
    },
    {
      $addFields: {
        profile: {
          $cond: {
            if: { $gt: [{ $size: '$studentProfile' }, 0] },
            then: { $arrayElemAt: ['$studentProfile', 0] },
            else: { $arrayElemAt: ['$recruiterProfile', 0] },
          },
        },
      },
    },
    {
      $addFields: {
        relevanceScore: {
          $add: [
            {
              $size: {
                $ifNull: [
                  {
                    $setIntersection: [
                      { $ifNull: ['$profile.skills', []] },
                      userSkills,
                    ],
                  },
                  [],
                ],
              },
            },
            {
              $cond: {
                if: {
                  $and: [
                    { $ne: [userSector, ''] },
                    { $eq: ['$profile.sector', userSector] },
                  ],
                },
                then: 2,
                else: 0,
              },
            },
          ],
        },
      },
    },
    { $sort: { relevanceScore: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        username: 1,
        avatar: {
          $cond: {
            if: { $and: [{ $ne: ['$avatar', null] }, { $ne: ['$avatar', ''] }] },
            then: { $concat: [config.serverUrl, '$avatar'] },
            else: null,
          },
        },
        role: 1,
        headline: { $ifNull: ['$profile.headline', null] },
        location: { $ifNull: ['$profile.location', null] },
        companyName: { $ifNull: ['$profile.companyName', null] },
      },
    },
  ]);

  return suggestions;
};

export const removeConnection = async (
  connectionId: string,
  userId: string
): Promise<void> => {
  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new AppError('Connection not found', 404);
  }

  if (
    connection.senderId.toString() !== userId &&
    connection.receiverId.toString() !== userId
  ) {
    throw new AppError('You can only remove your own connections', 403);
  }

  await Connection.findByIdAndDelete(connectionId);
};

export const getConnectionStatus = async (
  userId1: string,
  userId2: string
): Promise<{ status: string | null; connectionId: string | null }> => {
  const connection = await Connection.findOne({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  });

  if (!connection) {
    return { status: null, connectionId: null };
  }

  return { status: connection.status, connectionId: String(connection._id) };
};
