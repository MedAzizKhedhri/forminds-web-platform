'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const { users, pagination, isLoading, fetchUsers, updateUserStatus } = useAdmin();

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Suspend dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Role guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const loadUsers = useCallback(
    (page: number) => {
      const filters: { role?: string; status?: string; search?: string } = {};
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (search.trim()) filters.search = search.trim();
      fetchUsers(filters, page, 20);
    },
    [roleFilter, statusFilter, search, fetchUsers]
  );

  // Fetch on mount and filter changes
  useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentPage(1);
      loadUsers(1);
    }
  }, [user, roleFilter, statusFilter, loadUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page);
  };

  const handleSuspend = (userId: string, name: string) => {
    setSuspendTarget({ id: userId, name });
    setSuspendReason('');
    setSuspendDialogOpen(true);
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    setActionLoading(true);
    try {
      const res = await updateUserStatus(suspendTarget.id, false, suspendReason || undefined);
      if (res.success) {
        toast({ title: 'User suspended successfully' });
        setSuspendDialogOpen(false);
      }
    } catch {
      toast({
        title: 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (userId: string) => {
    setActionLoading(true);
    try {
      const res = await updateUserStatus(userId, true);
      if (res.success) {
        toast({ title: 'User reactivated successfully' });
      }
    } catch {
      toast({
        title: 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
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
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t.admin?.usersManagement || 'Users Management'}
        </h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.admin?.searchPlaceholder || 'Search by name or email...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t.admin?.role || 'Role'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin?.allRoles || 'All Roles'}</SelectItem>
                <SelectItem value="student">{'Student'}</SelectItem>
                <SelectItem value="recruiter">{'Recruiter'}</SelectItem>
                <SelectItem value="admin">{'Admin'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t.admin?.status || 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin?.allStatuses || 'All Statuses'}</SelectItem>
                <SelectItem value="active">{t.admin?.active || 'Active'}</SelectItem>
                <SelectItem value="suspended">{t.admin?.suspendedStatus || 'Suspended'}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              {t.admin?.searchPlaceholder || 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.name || 'Name'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.email || 'Email'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.role || 'Role'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.status || 'Status'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.joined || 'Joined'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.admin?.actions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t.admin?.noUsers || 'No users found'}</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'default'
                              : u.role === 'recruiter'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={u.isActive ? 'outline' : 'destructive'}
                          className={
                            u.isActive
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : ''
                          }
                        >
                          {u.isActive
                            ? (t.admin?.active || 'Active')
                            : (t.admin?.suspendedStatus || 'Suspended')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          u.isActive ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleSuspend(u._id, `${u.firstName} ${u.lastName}`)}
                              disabled={actionLoading}
                            >
                              {t.admin?.suspend || 'Suspend'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => handleReactivate(u._id)}
                              disabled={actionLoading}
                            >
                              {t.admin?.reactivate || 'Reactivate'}
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  ))
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

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.admin?.suspendUser || 'Suspend User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.admin?.suspendConfirm ||
                `Are you sure you want to suspend ${suspendTarget?.name}? They will not be able to access the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.admin?.suspendReason || 'Reason (optional)'}
              </label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder={t.admin?.suspendReasonPlaceholder || 'Enter reason for suspension...'}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {'Cancel'}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
              disabled={actionLoading}
            >
              {actionLoading
                ? ('Suspending...')
                : (t.admin?.suspend || 'Suspend')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
