'use client';

import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import type { Post } from '@/types';

interface PostFeedProps {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId: string;
  isAdmin?: boolean;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onEdit: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
}

function PostSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostFeed({
  posts,
  isLoading,
  hasMore,
  onLoadMore,
  currentUserId,
  isAdmin,
  onLike,
  onUnlike,
  onEdit,
  onDelete,
}: PostFeedProps) {
  const { t } = useLocale();

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            {t('feed.noPosts')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onLike={() => onLike(post._id)}
          onUnlike={() => onUnlike(post._id)}
          onEdit={(content) => onEdit(post._id, content)}
          onDelete={() => onDelete(post._id)}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading
              ? (t('common.loading'))
              : (t('feed.loadMore'))}
          </Button>
        </div>
      )}
    </div>
  );
}
