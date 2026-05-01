'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { MapPin, Calendar } from 'lucide-react';
import type { Application, Opportunity } from '@/types';

interface ApplicationCardProps {
  application: Application;
}

const typeLabels: Record<Opportunity['type'], string> = {
  stage: 'Stage',
  emploi: 'Emploi',
  benevolat: 'Benevolat',
};

function isPopulatedOpportunity(
  value: Opportunity | string
): value is Opportunity {
  return typeof value === 'object' && value !== null && '_id' in value;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { t, locale } = useLocale();

  const opportunity = application.opportunityId;
  const isPopulated = isPopulatedOpportunity(opportunity);

  const opportunityId = isPopulated ? opportunity._id : (opportunity as string);
  const title = isPopulated ? opportunity.title : opportunityId;
  const location = isPopulated ? opportunity.location : null;
  const type = isPopulated ? opportunity.type : null;

  const appliedDate = new Date(application.appliedAt).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <Link href={`/opportunities/${opportunityId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-tight line-clamp-2">
              {title}
            </h3>
            <ApplicationStatusBadge status={application.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {type && (
            <Badge variant="outline" className="text-xs">
              {t(`opportunities.${type}`)}
            </Badge>
          )}

          {location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}

          {isPopulated && typeof opportunity.recruiterId === 'object' && opportunity.recruiterId !== null && (
            <p className="text-sm text-muted-foreground">
              {(opportunity.recruiterId as { firstName: string; lastName: string }).firstName}{' '}
              {(opportunity.recruiterId as { firstName: string; lastName: string }).lastName}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {t('applications.appliedOn')} {appliedDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
