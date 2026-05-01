'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Calendar, ExternalLink } from 'lucide-react';
import type { Application, User } from '@/types';

interface ApplicationReceivedCardProps {
  application: Application;
  onStatusChange: (applicationId: string, status: Application['status']) => void;
}

const APPLICATION_STATUSES: Application['status'][] = [
  'pending',
  'reviewed',
  'shortlisted',
  'accepted',
  'rejected',
];

function isPopulatedUser(value: User | string): value is User {
  return typeof value === 'object' && value !== null && '_id' in value;
}

function getInitials(user: User): string {
  return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
}

export function ApplicationReceivedCard({
  application,
  onStatusChange,
}: ApplicationReceivedCardProps) {
  const { t, locale } = useLocale();

  const student = application.studentId;
  const isStudentPopulated = isPopulatedUser(student);

  const studentName = isStudentPopulated
    ? `${student.firstName} ${student.lastName}`
    : (student as string);

  const appliedDate = new Date(application.appliedAt).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {isStudentPopulated ? (
            <Avatar className="h-10 w-10 shrink-0">
              {student.avatar && (
                <AvatarImage src={student.avatar} alt={studentName} />
              )}
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(student)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-sm font-semibold">
                ??
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-tight truncate">
                {studentName}
              </h3>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {t('applications.appliedOn')} {appliedDate}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {application.coverLetter && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {application.coverLetter}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('applications.changeStatus')}
          </label>
          <Select
            value={application.status}
            onValueChange={(value) =>
              onStatusChange(application._id, value as Application['status'])
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((statusOption) => (
                <SelectItem key={statusOption} value={statusOption}>
                  {t(`applications.status_${statusOption}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isStudentPopulated && (
          <Link
            href={`/p/${student.username}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('applications.viewProfile')}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
