'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConnectionStatusBadgeProps {
  status: 'pending' | 'accepted' | 'rejected';
}

const statusStyles: Record<ConnectionStatusBadgeProps['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<ConnectionStatusBadgeProps['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'pointer-events-none font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}
