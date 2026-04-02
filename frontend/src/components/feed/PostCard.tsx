'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LikeButton } from '@/components/feed/LikeButton';
import { CommentSection } from '@/components/feed/CommentSection';
import { PostForm } from '@/components/feed/PostForm';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onUnlike: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  currentUserId: string;
  isAdmin?: boolean;
}

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'admin':
      return 'default';
    case 'recruiter':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function PostCard({
  post,
  onLike,
  onUnlike,
  onEdit,
  onDelete,
  currentUserId,
  isAdmin,
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useLocale();

  const author = post.authorId;
  const isAuthor = author._id === currentUserId;
  const canModify = isAuthor || !!isAdmin;
  const initials = `${author.firstName?.[0] || ''}${author.lastName?.[0] || ''}`.toUpperCase();

  const handleEdit = (content: string) => {
    onEdit?.(content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(t.feed?.confirmDelete || 'Are you sure you want to delete this post?')) {
      onDelete?.();
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex-row items-start gap-3 space-y-0 p-4 pb-2">
        <Avatar>
          <AvatarImage src={author.avatar} alt={`${author.firstName} ${author.lastName}`} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {author.firstName} {author.lastName}
            </span>
            <Badge variant={getRoleBadgeVariant(author.role)} className="text-[10px] px-1.5 py-0">
              {author.role}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(post.createdAt)}
          </p>
        </div>

        {canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t.feed?.edit || 'Edit'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.feed?.delete || 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {isEditing ? (
          <PostForm
            initialContent={post.content}
            isEditing
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words mb-3 leading-relaxed">
            {post.content}
          </p>
        )}

        {!isEditing && (
          <CommentSection
            postId={post._id}
            commentsCount={post.commentsCount}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            likeButton={
              <LikeButton
                isLiked={!!post.isLikedByMe}
                count={post.likesCount}
                onToggle={post.isLikedByMe ? onUnlike : onLike}
              />
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
