'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/hooks/useApplications';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { ApplicationCard } from '@/components/applications/ApplicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

function ApplicationCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-16 rounded-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLocale();
  const {
    applications,
    totalPages,
    isLoading,
    getMyApplications,
  } = useApplications();

  const [page, setPage] = useState(1);

  // Role guard: only students can access this page
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== 'student') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Fetch applications on mount and page change
  useEffect(() => {
    if (user && user.role === 'student') {
      getMyApplications(page);
    }
  }, [page, user, getMyApplications]);

  // Show nothing while auth is loading or redirecting
  if (isAuthLoading || !user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t.applications?.title ?? 'My Applications'}
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">
            {t.applications?.noApplications ?? 'No applications'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t.common?.back ?? 'Back'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {t.common?.next ?? 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
