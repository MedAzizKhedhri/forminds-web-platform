'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/hooks/useApplications';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import type { Application, User, Opportunity } from '@/types';

// ── Helpers ──

function isPopulatedUser(value: User | string): value is User {
  return typeof value === 'object' && value !== null && '_id' in value;
}

function isPopulatedOpportunity(value: Opportunity | string): value is Opportunity {
  return typeof value === 'object' && value !== null && '_id' in value;
}

function getInitials(user: User): string {
  return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
}

const STATUS_TABS = ['all', 'pending', 'reviewed', 'accepted', 'rejected'] as const;

const APPLICATION_STATUSES: Application['status'][] = [
  'pending', 'reviewed', 'shortlisted', 'accepted', 'rejected',
];

// ── Page Component ──

export default function ApplicantsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const {
    applications,
    totalPages,
    statusCounts,
    isLoading,
    getRecruiterApplications,
    updateApplicationStatus,
  } = useApplications();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Role guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'recruiter') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  // Data fetching
  const loadApplications = useCallback(
    (page: number, status?: string, searchTerm?: string) => {
      const filters: { status?: string; search?: string } = {};
      if (status && status !== 'all') filters.status = status;
      if (searchTerm?.trim()) filters.search = searchTerm.trim();
      getRecruiterApplications(filters, page, 20);
    },
    [getRecruiterApplications]
  );

  useEffect(() => {
    if (user?.role === 'recruiter') {
      setCurrentPage(1);
      loadApplications(1, activeTab, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, loadApplications]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadApplications(1, activeTab, search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadApplications(page, activeTab, search);
  };

  const handleRowClick = (application: Application) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const handleStatusChange = useCallback(
    async (applicationId: string, status: Application['status']) => {
      try {
        await updateApplicationStatus(applicationId, status);
        toast({
          title: t.common?.success || 'Success',
          description: 'Application status updated.',
        });
        if (selectedApplication?._id === applicationId) {
          setSelectedApplication((prev) => prev ? { ...prev, status } : null);
        }
        loadApplications(currentPage, activeTab, search);
      } catch {
        toast({
          variant: 'destructive',
          title: t.common?.error || 'Error',
          description: 'Failed to update application status.',
        });
      }
    },
    [updateApplicationStatus, toast, t, selectedApplication, loadApplications, currentPage, activeTab, search]
  );

  const allCount = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

  if (authLoading || !user || user.role !== 'recruiter') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            {t.applicants?.title || 'Applicants'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t.applicants?.subtitle || 'Review and manage applicants for your job postings.'}
        </p>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {STATUS_TABS.map((tab) => {
            const count = tab === 'all'
              ? allCount
              : (statusCounts[tab] ?? 0);
            const label = tab === 'all'
              ? (t.applicants?.all || 'All')
              : (t.applications?.status?.[tab] ?? tab);
            return (
              <TabsTrigger key={tab} value={tab}>
                {label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.applicants?.searchPlaceholder || 'Search by name or email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          <Search className="h-4 w-4 mr-2" />
          {t.common?.search || 'Search'}
        </Button>
      </div>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-12">
                    {t.applicants?.no || 'NO'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.applicants?.candidate || 'CANDIDATE'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                    {t.applicants?.opportunity || 'OPPORTUNITY'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    {t.applicants?.coverLetter || 'COVER LETTER'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t.applicants?.statusCol || 'STATUS'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-6" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    </tr>
                  ))
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t.applicants?.noApplicants || 'No applicants found'}</p>
                    </td>
                  </tr>
                ) : (
                  applications.map((app, index) => {
                    const student = app.studentId;
                    const studentPopulated = isPopulatedUser(student);
                    const studentName = studentPopulated
                      ? `${student.firstName} ${student.lastName}`
                      : (student as string);
                    const studentEmail = studentPopulated ? student.email : '';
                    const opportunity = app.opportunityId;
                    const oppTitle = isPopulatedOpportunity(opportunity)
                      ? opportunity.title
                      : '';

                    return (
                      <tr
                        key={app._id}
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(app)}
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground font-medium">
                          {String((currentPage - 1) * 20 + index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {studentPopulated ? (
                              <Avatar className="h-8 w-8">
                                {student.avatar && (
                                  <AvatarImage src={student.avatar} alt={studentName} />
                                )}
                                <AvatarFallback className="text-xs font-semibold">
                                  {getInitials(student)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">??</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <p className="text-sm font-medium">{studentName}</p>
                              <p className="text-xs text-muted-foreground">{studentEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          <span className="truncate block max-w-[200px]">{oppTitle}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                          <p className="truncate max-w-[300px]">
                            {app.coverLetter || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <ApplicationStatusBadge status={app.status} />
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
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t.common?.back || 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            {t.common?.next || 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedApplication && (() => {
            const student = selectedApplication.studentId;
            const populated = isPopulatedUser(student);
            const name = populated
              ? `${student.firstName} ${student.lastName}`
              : (student as string);
            const email = populated ? student.email : '';
            const appliedDate = new Date(selectedApplication.appliedAt).toLocaleDateString(
              'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            );
            const opportunity = selectedApplication.opportunityId;
            const oppTitle = isPopulatedOpportunity(opportunity) ? opportunity.title : '';

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    {populated ? (
                      <Avatar className="h-12 w-12">
                        {student.avatar && (
                          <AvatarImage src={student.avatar} alt={name} />
                        )}
                        <AvatarFallback className="font-semibold">
                          {getInitials(student)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>??</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <DialogTitle>{name}</DialogTitle>
                      <DialogDescription>{email}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Applied date & opportunity */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t.applications?.appliedOn || 'Applied on'} {appliedDate}</span>
                    </div>
                    {oppTitle && (
                      <p className="text-sm font-medium text-muted-foreground pl-6">
                        {oppTitle}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Status changer */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t.applications?.changeStatus || 'Change status'}
                    </label>
                    <Select
                      value={selectedApplication.status}
                      onValueChange={(value) =>
                        handleStatusChange(selectedApplication._id, value as Application['status'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t.applications?.status?.[s] ?? s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Cover letter */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      {t.opportunities?.coverLetter || 'Cover Letter'}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/50 p-3">
                      {selectedApplication.coverLetter || (t.applicants?.noCoverLetter || 'No cover letter provided.')}
                    </p>
                  </div>

                  <Separator />

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {populated && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/p/${student.username}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {t.applications?.viewProfile || 'View Profile'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
