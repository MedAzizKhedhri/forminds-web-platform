import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import * as postService from '../services/post.service';

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(2000),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { content } = createPostSchema.parse(req.body);

  const post = await postService.createPost(req.user.userId, content);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: { post },
  });
});

export const getFeed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await postService.getFeed(req.user.userId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Feed retrieved successfully',
    data: {
      data: result.posts,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const getPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { postId } = req.params;

  const post = await postService.getPost(postId);

  res.status(200).json({
    success: true,
    message: 'Post retrieved successfully',
    data: { post },
  });
});

export const updatePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { content } = updatePostSchema.parse(req.body);
  const { postId } = req.params;

  const post = await postService.updatePost(postId, req.user.userId, req.user.role, content);

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: { post },
  });
});

export const deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { postId } = req.params;

  await postService.deletePost(postId, req.user.userId, req.user.role);

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

export const likePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { postId } = req.params;

  const like = await postService.likePost(req.user.userId, postId);

  res.status(201).json({
    success: true,
    message: 'Post liked successfully',
    data: { like },
  });
});

export const unlikePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { postId } = req.params;

  await postService.unlikePost(req.user.userId, postId);

  res.status(200).json({
    success: true,
    message: 'Like removed successfully',
  });
});

export const addComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { content } = createCommentSchema.parse(req.body);
  const { postId } = req.params;

  const comment = await postService.addComment(req.user.userId, postId, content);

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment },
  });
});

export const getComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { postId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await postService.getComments(postId, page, limit);

  const totalPages = Math.ceil(result.total / limit);

  res.status(200).json({
    success: true,
    message: 'Comments retrieved successfully',
    data: {
      data: result.comments,
      total: result.total,
      page,
      totalPages,
    },
  });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { commentId } = req.params;

  await postService.deleteComment(commentId, req.user.userId, req.user.role);

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
});
