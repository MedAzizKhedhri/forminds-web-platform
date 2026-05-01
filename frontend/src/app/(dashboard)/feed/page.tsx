'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { PostForm } from '@/components/feed/PostForm';
import { PostFeed } from '@/components/feed/PostFeed';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';

export default function FeedPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const {
    posts,
    totalPages,
    isLoading,
    fetchFeed,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
  } = usePosts();

  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();

  const currentUserId = user?._id || '';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchFeed(nextPage);
  }, [currentPage, fetchFeed]);

  const handleCreate = async (content: string) => {
    setIsCreating(true);
    try {
      const res = await createPost(content);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('feed.createPost'),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to create post.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (postId: string, content: string) => {
    try {
      const res = await updatePost(postId, content);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('feed.editPost'),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to update post.',
      });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await deletePost(postId);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('feed.delete'),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to delete post.',
      });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to like post.',
      });
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      await unlikePost(postId);
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to unlike post.',
      });
    }
  };

  const hasMore = currentPage < totalPages;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t('feed.title')}</h1>
      </div>

      <PostForm onSubmit={handleCreate} isLoading={isCreating} />

      <PostFeed
        posts={posts}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onLike={handleLike}
        onUnlike={handleUnlike}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
