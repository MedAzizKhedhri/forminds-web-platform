'use client';

import { MapPin, Calendar, Building2, Tag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OpportunityStatusBadge } from '@/components/opportunities/OpportunityStatusBadge';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import type { Opportunity, User } from '@/types';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  userRole?: string;
  userId?: string;
  onApply?: () => void;
  hasApplied?: boolean;
  onEdit?: () => void;
  onClose?: () => void;
  onReopen?: () => void;
  onDelete?: () => void;
}

const typeBadgeStyles: Record<Opportunity['type'], string> = {
  stage: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  emploi: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  benevolat: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
};

export function OpportunityDetail({
  opportunity,
  userRole,
  userId,
  onApply,
  hasApplied = false,
  onEdit,
  onClose,
  onReopen,
  onDelete,
}: OpportunityDetailProps) {
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

  const isDeadlinePassed = opportunity.deadline
    ? new Date(opportunity.deadline) < new Date()
    : false;

  const isClosed = opportunity.status === 'closed';

  const isOwner =
    userRole === 'recruiter' &&
    recruiter !== null &&
    !!userId &&
    recruiter._id === userId;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
          <OpportunityStatusBadge status={opportunity.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(typeBadgeStyles[opportunity.type])}
          >
            {typeLabel[opportunity.type]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Meta info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {opportunity.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{opportunity.location}</span>
            </div>
          )}

          {opportunity.domain && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4 shrink-0" />
              <span>
                {t.opportunities?.domain || 'Domain'}: {opportunity.domain}
              </span>
            </div>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>
                {recruiter.firstName} {recruiter.lastName}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-semibold">
            {t.opportunities?.description || 'Description'}
          </h3>
          <p className="text-sm whitespace-pre-wrap">{opportunity.description}</p>
        </div>

        {/* Skills */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">
              {t.opportunities?.skills || 'Required skills'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.skills.map((skill, i) => (
                <Badge key={`${skill}-${i}`} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {opportunity.requirements && (
          <div className="space-y-2">
            <h3 className="font-semibold">
              {t.opportunities?.requirements || 'Requirements'}
            </h3>
            <p className="text-sm whitespace-pre-wrap">{opportunity.requirements}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {/* Student view */}
          {userRole === 'student' && !isClosed && !isDeadlinePassed && !hasApplied && (
            <Button onClick={onApply}>
              {t.opportunities?.apply || 'Apply'}
            </Button>
          )}

          {userRole === 'student' && hasApplied && (
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              {t.opportunities?.alreadyApplied || 'Already applied'}
            </Badge>
          )}

          {userRole === 'student' && (isClosed || isDeadlinePassed) && !hasApplied && (
            <Badge variant="outline" className="text-sm py-1.5 px-3 bg-gray-100 text-gray-600">
              {t.opportunities?.closed || 'Closed'}
            </Badge>
          )}

          {/* Recruiter (owner) view */}
          {isOwner && !isClosed && (
            <>
              <Button variant="outline" onClick={onEdit}>
                {t.opportunities?.edit || 'Edit'}
              </Button>
              <Button variant="destructive" onClick={onClose}>
                {t.opportunities?.close || 'Close opportunity'}
              </Button>
            </>
          )}

          {isOwner && isClosed && (
            <>
              <Button variant="outline" onClick={onReopen}>
                Reopen
              </Button>
              <Button variant="destructive" onClick={onDelete} className="gap-1">
                <Trash2 className="h-4 w-4" />
                {((t.opportunities as any)?.delete) || 'Delete'}
              </Button>
            </>
          )}

          {isOwner && !isClosed && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1">
              <Trash2 className="h-4 w-4" />
              {((t.opportunities as any)?.delete) || 'Delete'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
