'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { UserPlus, Lightbulb, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { User } from '@/types';

interface SuggestionListProps {
  suggestions: User[];
  isLoading: boolean;
  onConnect: (userId: string) => Promise<void>;
}

function SuggestionListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-9 w-24 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SuggestionCard({
  user,
  onConnect,
}: {
  user: User;
  onConnect: (userId: string) => Promise<void>;
}) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const fullName = `${user.firstName} ${user.lastName}`;
  const headline = (user as User & { headline?: string }).headline;
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await onConnect(user._id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col items-center gap-3 p-6">
        <Avatar className="h-16 w-16">
          {user.avatar && <AvatarImage src={user.avatar} alt={fullName} />}
          <AvatarFallback className="text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-1 text-center">
          <Link
            href={`/p/${user.username}`}
            className="text-sm font-semibold hover:underline"
          >
            {fullName}
          </Link>
          {headline && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {headline}
            </p>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleConnect}
          disabled={isLoading}
          className="mt-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-1 h-4 w-4" />
          )}
          {t.network?.connect || 'Connect'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SuggestionList({
  suggestions,
  isLoading,
  onConnect,
}: SuggestionListProps) {
  const { t } = useLocale();

  if (isLoading) {
    return <SuggestionListSkeleton />;
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Lightbulb className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">{t.network?.noSuggestions || 'No suggestions available'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {suggestions.map((user) => (
        <SuggestionCard key={user._id} user={user} onConnect={onConnect} />
      ))}
    </div>
  );
}
