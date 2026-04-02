'use client';

import { ConnectionCard } from '@/components/network/ConnectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Inbox } from 'lucide-react';
import type { Connection } from '@/types';

interface PendingRequestListProps {
  requests: Connection[];
  isLoading: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

function PendingRequestListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PendingRequestList({
  requests,
  isLoading,
  onAccept,
  onReject,
}: PendingRequestListProps) {
  const { t } = useLocale();

  if (isLoading) {
    return <PendingRequestListSkeleton />;
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">{t.network?.noPending || 'No pending requests'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.map((request) => (
        <ConnectionCard
          key={request._id}
          connection={request}
          variant="received"
          onAccept={() => onAccept(request._id)}
          onReject={() => onReject(request._id)}
        />
      ))}
    </div>
  );
}
