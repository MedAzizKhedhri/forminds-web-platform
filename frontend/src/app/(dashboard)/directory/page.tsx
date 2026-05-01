'use client';

import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { Search } from 'lucide-react';
import { useDirectory } from '@/hooks/useDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import { DirectoryFilters } from '@/components/directory/DirectoryFilters';
import { DirectoryGrid } from '@/components/directory/DirectoryGrid';

export default function DirectoryPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { profiles, totalPages, isLoading, searchProfiles } = useDirectory();
  const { sendRequest } = useConnections();
  const [page, setPage] = useState(1);
  const [optimisticPending, setOptimisticPending] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<{ skills?: string; domain?: string; city?: string }>({});

  useEffect(() => {
    searchProfiles({ ...filters, page });
  }, [searchProfiles, filters, page]);

  // Reset optimistic state when profiles reload (backend has the real status now)
  useEffect(() => {
    setOptimisticPending({});
  }, [profiles]);

  const handleFilterChange = useCallback(
    (newFilters: { skills?: string; domain?: string; city?: string }) => {
      setFilters(newFilters);
      setPage(1);
    },
    []
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleConnect = useCallback(async (userId: string) => {
    if (optimisticPending[userId]) return;

    setOptimisticPending((prev) => ({ ...prev, [userId]: true }));

    try {
      const res = await sendRequest(userId);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('network.pending'),
        });
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message = axiosErr.response?.data?.message || t('common.error');

      setOptimisticPending((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });

      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  }, [optimisticPending, sendRequest, t, toast]);

  // Merge backend connectionStatus with optimistic local state
  const profilesWithStatus = profiles.map((profile) => ({
    ...profile,
    connectionStatus: optimisticPending[profile.userId._id]
      ? 'pending'
      : profile.connectionStatus || undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6" />
          {t('directory.title')}
        </h1>
      </div>

      <DirectoryFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      <DirectoryGrid
        profiles={profilesWithStatus}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onConnect={handleConnect}
      />
    </div>
  );
}
