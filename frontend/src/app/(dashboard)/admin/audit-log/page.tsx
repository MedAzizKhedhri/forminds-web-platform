'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import type { AuditLog } from '@/types';

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'opportunity_approved', label: 'Opportunity Approved' },
  { value: 'opportunity_rejected', label: 'Opportunity Rejected' },
  { value: 'event_approved', label: 'Event Approved' },
  { value: 'event_rejected', label: 'Event Rejected' },
  { value: 'recruiter_verified', label: 'Organisation Verified' },
  { value: 'user_suspended', label: 'User Suspended' },
  { value: 'user_reactivated', label: 'User Reactivated' },
];

function getActionBadgeVariant(action: string): {
  className: string;
  label: string;
} {
  const positiveActions = ['opportunity_approved', 'event_approved', 'recruiter_verified', 'user_reactivated'];
  const negativeActions = ['opportunity_rejected', 'event_rejected', 'user_suspended'];

  const label = action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (positiveActions.includes(action)) {
    return {
      className: 'border-green-300 bg-green-50 text-green-700',
      label,
    };
  }
  if (negativeActions.includes(action)) {
    return {
      className: 'border-red-300 bg-red-50 text-red-700',
      label,
    };
  }
  return {
    className: '',
    label,
  };
}

export default function AdminAuditLogPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { auditLogs, pagination, isLoading, fetchAuditLogs } = useAdmin();

  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Role guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const loadLogs = useCallback(
    (page: number) => {
      const filters: { action?: string } = {};
      if (actionFilter !== 'all') filters.action = actionFilter;
      fetchAuditLogs(filters, page, 50);
    },
    [actionFilter, fetchAuditLogs]
  );

  // Fetch on mount and filter change
  useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentPage(1);
      const filters: { action?: string } = {};
      if (actionFilter !== 'all') filters.action = actionFilter;
      fetchAuditLogs(filters, 1, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, actionFilter, fetchAuditLogs]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadLogs(page);
  };

  const getAdminName = (log: AuditLog): string => {
    if (typeof log.adminId === 'object' && log.adminId !== null) {
      return `${log.adminId.firstName} ${log.adminId.lastName}`;
    }
    return t.admin?.unknownAdmin || 'Unknown Admin';
  };

  const formatDetails = (details?: Record<string, unknown>): string => {
    if (!details || Object.keys(details).length === 0) return '-';
    return JSON.stringify(details);
  };

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t.admin?.auditLog || 'Audit Log'}
        </h1>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder={t.admin?.filterByAction || 'Action Type'} />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.date || 'Date'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.adminCol || 'Admin'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.action || 'Action'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.targetType || 'Target Type'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.details || 'Details'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.ipAddress || 'IP Address'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                    </tr>
                  ))
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t.admin?.noAuditLogs || 'No audit logs found'}</p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const actionBadge = getActionBadgeVariant(log.action);
                    return (
                      <tr key={log._id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {getAdminName(log)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={actionBadge.className}
                          >
                            {actionBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                          {log.targetType}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                          {formatDetails(log.details)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {'Page'} {currentPage} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
          >
            {'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
