'use client';

import Link from 'next/link';
import { MapPin, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import type { Opportunity, User } from '@/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const typeBadgeStyles: Record<Opportunity['type'], string> = {
  stage: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  emploi: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  benevolat: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { t } = useLocale();

  const typeLabel: Record<Opportunity['type'], string> = {
    stage: t.opportunities?.stage || 'Internship',
    emploi: t.opportunities?.emploi || 'Employment',
    benevolat: t.opportunities?.benevolat || 'Volunteering',
  };

  const recruiter =
    typeof opportunity.recruiterId === 'object'
      ? (opportunity.recruiterId as User)
      : null;

  return (
    <Link href={`/opportunities/${opportunity._id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn('w-fit', typeBadgeStyles[opportunity.type])}
          >
            {typeLabel[opportunity.type]}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-2">
          {opportunity.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          )}

          {opportunity.domain && (
            <p className="text-sm text-muted-foreground truncate">
              {t.opportunities?.domain || 'Domain'}: {opportunity.domain}
            </p>
          )}

          {opportunity.deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {t.opportunities?.deadline || 'Deadline'}:{' '}
                {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            </div>
          )}

          {recruiter && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {recruiter.firstName} {recruiter.lastName}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
