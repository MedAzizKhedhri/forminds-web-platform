import mongoose from 'mongoose';
import Post, { IPost } from '../models/Post';
import Like, { ILike } from '../models/Like';
import Comment, { IComment } from '../models/Comment';
import AppError from '../utils/AppError';
import config from '../config';

export const createPost = async (
  authorId: string,
  content: string
): Promise<IPost> => {
  const post = await Post.create({
    authorId,
    content,
    likesCount: 0,
    commentsCount: 0,
  });

  return post;
};

export const updatePost = async (
  postId: string,
  userId: string,
  role: string,
  content: string
): Promise<IPost> => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.authorId.toString() !== userId && role !== 'admin') {
    throw new AppError('You can only edit your own posts', 403);
  }

  post.content = content;
  await post.save();

  return post;
};

export const deletePost = async (
  postId: string,
  userId: string,
  role: string
): Promise<void> => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.authorId.toString() !== userId && role !== 'admin') {
    throw new AppError('You can only delete your own posts', 403);
  }

  // Cascade delete: remove post, its likes, and its comments
  await Promise.all([
    Post.findByIdAndDelete(postId),
    Like.deleteMany({ postId }),
    Comment.deleteMany({ postId }),
  ]);
};

export const getFeed = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ posts: mongoose.Document[]; total: number }> => {
  const skip = (page - 1) * limit;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const total = await Post.countDocuments();

  const posts = await Post.aggregate([
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $lookup: {
        from: 'likes',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$postId', '$$postId'] },
                  { $eq: ['$userId', userObjectId] },
                ],
              },
            },
          },
        ],
        as: 'userLike',
      },
    },
    {
      $project: {
        content: 1,
        likesCount: 1,
        commentsCount: 1,
        createdAt: 1,
        updatedAt: 1,
        isLikedByMe: { $gt: [{ $size: '$userLike' }, 0] },
        authorId: {
          _id: '$author._id',
          firstName: '$author.firstName',
          lastName: '$author.lastName',
          username: '$author.username',
          avatar: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$author.avatar', null] },
                  { $ne: [{ $type: '$author.avatar' }, 'missing'] },
                  { $eq: [{ $substrBytes: ['$author.avatar', 0, 1] }, '/'] },
                ],
              },
              then: { $concat: [config.serverUrl, '$author.avatar'] },
              else: '$author.avatar',
            },
          },
          role: '$author.role',
        },
      },
    },
  ]);

  return { posts, total };
};

export const getPost = async (postId: string): Promise<IPost> => {
  const post = await Post.findById(postId).populate(
    'authorId',
    'firstName lastName username avatar role'
  );

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return post;
};

export const likePost = async (
  userId: string,
  postId: string
): Promise<ILike> => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const existing = await Like.findOne({ userId, postId });
  if (existing) {
    throw new AppError('You have already liked this post', 409);
  }

  const like = await Like.create({ userId, postId });
  await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

  return like;
};

export const unlikePost = async (
  userId: string,
  postId: string
): Promise<void> => {
  const like = await Like.findOne({ userId, postId });
  if (!like) {
    throw new AppError('You have not liked this post', 404);
  }

  await Like.findByIdAndDelete(like._id);
  await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
};

export const addComment = async (
  authorId: string,
  postId: string,
  content: string
): Promise<IComment> => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = await Comment.create({ authorId, postId, content });
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  return comment;
};

export const getComments = async (
  postId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ comments: IComment[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = { postId };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate('authorId', 'firstName lastName username avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Comment.countDocuments(filter),
  ]);

  return { comments, total };
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  role: string
): Promise<void> => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.authorId.toString() !== userId && role !== 'admin') {
    throw new AppError('You can only delete your own comments', 403);
  }

  await Comment.findByIdAndDelete(commentId);
  await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });
};
