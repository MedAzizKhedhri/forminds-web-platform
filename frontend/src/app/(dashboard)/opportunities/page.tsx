'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { OpportunityFilters } from '@/components/opportunities/OpportunityFilters';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';

export default function OpportunitiesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{ type?: string; location?: string; domain?: string }>({});

  const { opportunities, totalPages, isLoading, searchOpportunities } = useOpportunities();
  const { user } = useAuth();
  const { t } = useLocale();

  const isRecruiter = user?.role === 'recruiter';

  const fetchData = useCallback(
    (page: number, currentFilters: typeof filters) => {
      searchOpportunities({ ...currentFilters, page, limit: 12 });
    },
    [searchOpportunities]
  );

  useEffect(() => {
    fetchData(1, filters);
  }, [fetchData, filters]);

  const handleFilterChange = (newFilters: { type?: string; location?: string; domain?: string }) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, filters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">
            {t.opportunities?.title || 'Opportunities'}
          </h1>
        </div>

        {isRecruiter && (
          <Button asChild>
            <Link href="/opportunities/create">
              <Plus className="h-4 w-4 mr-2" />
              {t.opportunities?.create || 'Create opportunity'}
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <OpportunityFilters onFilterChange={handleFilterChange} />

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Opportunity grid */}
      {!isLoading && opportunities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp._id} opportunity={opp} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && opportunities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t.opportunities?.noOpportunities || 'No opportunities available'}</p>
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
