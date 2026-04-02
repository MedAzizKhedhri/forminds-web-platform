'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onToggle: () => void;
}

export function LikeButton({ isLiked, count, onToggle }: LikeButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 cursor-pointer transition-colors hover:text-red-500"
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          isLiked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'
        )}
      />
      <span
        className={cn(
          'text-sm font-medium',
          isLiked ? 'text-red-500' : 'text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  );
}
