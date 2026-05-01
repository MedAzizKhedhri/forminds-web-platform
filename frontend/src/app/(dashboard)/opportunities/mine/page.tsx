'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Eye, XCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OpportunityStatusBadge } from '@/components/opportunities/OpportunityStatusBadge';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';

export default function MyOpportunitiesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    opportunities,
    totalPages,
    isLoading,
    getMyOpportunities,
    closeOpportunity,
    reopenOpportunity,
    deleteOpportunity,
  } = useOpportunities();
  const { t } = useLocale();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // Role guard: redirect if not recruiter
  useEffect(() => {
    if (!authLoading && user && user.role !== 'recruiter') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'recruiter') {
      getMyOpportunities(1);
    }
  }, [user, getMyOpportunities]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      getMyOpportunities(page);
    },
    [getMyOpportunities]
  );

  const handleClose = async (id: string) => {
    if (!window.confirm('Are you sure you want to close this opportunity?')) {
      return;
    }

    try {
      const res = await closeOpportunity(id);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('opportunities.close'),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to close opportunity.',
      });
    }
  };

  const handleReopen = async (id: string) => {
    if (!window.confirm('Are you sure you want to reopen this opportunity?')) {
      return;
    }

    try {
      const res = await reopenOpportunity(id);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: 'Opportunity reopened successfully.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to reopen opportunity.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this opportunity? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await deleteOpportunity(id);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: 'Opportunity deleted successfully.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to delete opportunity.',
      });
    }
  };

  // Don't render for non-recruiters
  if (authLoading || (user && user.role !== 'recruiter')) {
    return null;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6" />
        <h1 className="text-2xl font-bold">
          {t('opportunities.myOpportunities')}
        </h1>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Opportunities grid */}
      {!isLoading && opportunities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <Card key={opp._id} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{opp.title}</CardTitle>
                  <OpportunityStatusBadge status={opp.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {opp.location && (
                  <p className="text-sm text-muted-foreground truncate">
                    {opp.location}
                  </p>
                )}
                {opp.domain && (
                  <p className="text-sm text-muted-foreground truncate">
                    {opp.domain}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/opportunities/${opp._id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common.view')}
                    </Link>
                  </Button>

                  {opp.status !== 'closed' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleClose(opp._id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t('common.close')}
                    </Button>
                  )}

                  {opp.status === 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReopen(opp._id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reopen
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(opp._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('opportunities.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && opportunities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('opportunities.noOpportunities')}</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
