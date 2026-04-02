'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Post, Comment, ApiResponse, PaginatedResponse } from '@/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeed = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Post>>>(
        '/posts',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        if (page === 1) {
          setPosts(res.data.data);
        } else {
          setPosts((prev) => [...prev, ...res.data!.data]);
        }
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = useCallback(async (content: string) => {
    const { data: res } = await api.post<ApiResponse<{ post: Post }>>('/posts', { content });
    if (res.success && res.data) {
      setPosts((prev) => [res.data!.post, ...prev]);
    }
    return res;
  }, []);

  const updatePost = useCallback(async (postId: string, content: string) => {
    const { data: res } = await api.patch<ApiResponse<{ post: Post }>>(`/posts/${postId}`, { content });
    if (res.success && res.data) {
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data!.post : p)));
    }
    return res;
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    const { data: res } = await api.delete<ApiResponse>(`/posts/${postId}`);
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    }
    return res;
  }, []);

  const likePost = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, isLikedByMe: true, likesCount: p.likesCount + 1 }
          : p
      )
    );
    try {
      await api.post(`/posts/${postId}/like`);
    } catch {
      // Rollback on error
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, isLikedByMe: false, likesCount: p.likesCount - 1 }
            : p
        )
      );
    }
  }, []);

  const unlikePost = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, isLikedByMe: false, likesCount: p.likesCount - 1 }
          : p
      )
    );
    try {
      await api.delete(`/posts/${postId}/like`);
    } catch {
      // Rollback on error
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, isLikedByMe: true, likesCount: p.likesCount + 1 }
            : p
        )
      );
    }
  }, []);

  const fetchComments = useCallback(async (postId: string, page = 1, limit = 10) => {
    const { data: res } = await api.get<ApiResponse<PaginatedResponse<Comment>>>(
      `/posts/${postId}/comments`,
      { params: { page, limit } }
    );
    return res.data;
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    const { data: res } = await api.post<ApiResponse<{ comment: Comment }>>(
      `/posts/${postId}/comments`,
      { content }
    );
    if (res.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );
    }
    return res;
  }, []);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    const { data: res } = await api.delete<ApiResponse>(`/posts/${postId}/comments/${commentId}`);
    if (res.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, commentsCount: p.commentsCount - 1 } : p
        )
      );
    }
    return res;
  }, []);

  return {
    posts,
    totalPages,
    isLoading,
    fetchFeed,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    fetchComments,
    addComment,
    deleteComment,
  };
}
