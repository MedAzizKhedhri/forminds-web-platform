'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentItem } from '@/components/feed/CommentItem';
import { CommentForm } from '@/components/feed/CommentForm';
import { usePosts } from '@/hooks/usePosts';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import type { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  commentsCount: number;
  currentUserId: string;
  isAdmin?: boolean;
  likeButton?: ReactNode;
}

export function CommentSection({
  postId,
  commentsCount,
  currentUserId,
  isAdmin,
  likeButton,
}: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetchComments, addComment, deleteComment } = usePosts();
  const { toast } = useToast();
  const { t } = useLocale();

  const loadComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const result = await fetchComments(postId);
      if (result) {
        setComments(result.data);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to load comments.',
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, [fetchComments, postId, toast, t]);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const handleAddComment = async (content: string) => {
    setIsSubmitting(true);
    try {
      const res = await addComment(postId, content);
      if (res.success && res.data?.comment) {
        const newComment = res.data.comment;
        setComments((prev) => [...prev, newComment]);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to add comment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await deleteComment(postId, commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to delete comment.',
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 pt-2 border-t">
        {likeButton}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">{commentsCount}</span>
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-1 border-t pt-3">
          {isLoadingComments ? (
            <p className="text-sm text-muted-foreground py-2">
              {t('common.loading')}
            </p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t('feed.comments')} (0)
            </p>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  canDelete={
                    (typeof comment.authorId === 'object' &&
                      comment.authorId._id === currentUserId) ||
                    !!isAdmin
                  }
                  onDelete={() => handleDeleteComment(comment._id)}
                />
              ))}
            </div>
          )}

          <CommentForm onSubmit={handleAddComment} isLoading={isSubmitting} />
        </div>
      )}
    </div>
  );
}
