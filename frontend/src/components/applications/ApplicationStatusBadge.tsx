'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface ApplicationStatusBadgeProps {
  status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
}

const statusStyles: Record<ApplicationStatusBadgeProps['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  shortlisted: 'bg-violet-100 text-violet-800 border-violet-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const { t } = useLocale();

  const label = t.applications?.status?.[status] ?? status;

  return (
    <Badge
      className={cn(
        'pointer-events-none font-medium',
        statusStyles[status]
      )}
    >
      {label}
    </Badge>
  );
}
