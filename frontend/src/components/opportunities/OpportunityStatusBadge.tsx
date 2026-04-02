'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface OpportunityStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'closed';
}

const statusStyles: Record<OpportunityStatusBadgeProps['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
  approved: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  rejected: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  closed: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100',
};

export function OpportunityStatusBadge({ status }: OpportunityStatusBadgeProps) {
  const { t } = useLocale();

  const label =
    t.opportunities?.status?.[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant="outline" className={cn(statusStyles[status])}>
      {label}
    </Badge>
  );
}
