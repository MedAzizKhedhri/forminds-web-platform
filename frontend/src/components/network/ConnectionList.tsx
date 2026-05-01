'use client';

import { ConnectionCard } from '@/components/network/ConnectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Users } from 'lucide-react';
import type { Connection } from '@/types';

interface ConnectionListProps {
  connections: Connection[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  currentUserId: string;
}

function ConnectionListSkeleton() {
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

export function ConnectionList({
  connections,
  isLoading,
  onRemove,
  currentUserId,
}: ConnectionListProps) {
  const { t } = useLocale();

  if (isLoading) {
    return <ConnectionListSkeleton />;
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">{t('network.noConnections')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection._id}
          connection={connection}
          variant="accepted"
          onRemove={() => onRemove(connection._id)}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
