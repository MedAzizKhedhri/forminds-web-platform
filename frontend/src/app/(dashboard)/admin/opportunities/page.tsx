'use client';

import { useEffect, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import type { Opportunity, User } from '@/types';

export default function AdminOpportunitiesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const {
    pendingOpportunities,
    pagination,
    isLoading,
    fetchPendingOpportunities,
    validateOpportunity,
  } = useAdmin();

  const [currentPage, setCurrentPage] = useState(1);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  // Fetch pending opportunities
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingOpportunities(1, 20);
    }
  }, [user, fetchPendingOpportunities]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPendingOpportunities(page, 20);
  };

  const handleApprove = async (opportunityId: string) => {
    setActionLoading(opportunityId);
    try {
      const res = await validateOpportunity(opportunityId, 'approved');
      if (res.success) {
        toast({ title: 'Opportunity approved successfully' });
      }
    } catch {
      toast({
        title: 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (opportunityId: string) => {
    setRejectTarget(opportunityId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget);
    try {
      const res = await validateOpportunity(
        rejectTarget,
        'rejected',
        rejectionReason || undefined
      );
      if (res.success) {
        toast({ title: 'Opportunity rejected' });
        setRejectDialogOpen(false);
      }
    } catch {
      toast({
        title: 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRecruiterName = (opp: Opportunity): string => {
    if (typeof opp.recruiterId === 'object' && opp.recruiterId !== null) {
      const recruiter = opp.recruiterId as User;
      return `${recruiter.firstName} ${recruiter.lastName}`;
    }
    return 'Unknown Recruiter';
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stage: t.opportunities?.stage || 'Internship',
      emploi: t.opportunities?.emploi || 'Job',
      benevolat: t.opportunities?.benevolat || 'Volunteering',
    };
    return labels[type] || type;
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
        <ClipboardList className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t.admin?.pendingOpportunities || 'Pending Opportunities'}
        </h1>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-20 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pendingOpportunities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {t.admin?.noPendingOpportunities || 'No pending opportunities'}
          </p>
          <p className="text-sm mt-1">
            {'All opportunities have been reviewed'}
          </p>
        </div>
      )}

      {/* Opportunity cards */}
      {!isLoading && pendingOpportunities.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingOpportunities.map((opp) => (
            <Card key={opp._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{opp.title}</CardTitle>
                  <Badge variant="secondary">{typeLabel(opp.type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {opp.description.length > 200
                    ? `${opp.description.slice(0, 200)}...`
                    : opp.description}
                </p>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {opp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {opp.location}
                    </span>
                  )}
                  {opp.domain && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {opp.domain}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(opp.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {opp.skills && opp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {opp.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {'Posted by'}:{' '}
                  </span>
                  <span className="font-medium">{getRecruiterName(opp)}</span>
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => handleApprove(opp._id)}
                    disabled={actionLoading === opp._id}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t.admin?.approve || 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => openRejectDialog(opp._id)}
                    disabled={actionLoading === opp._id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t.admin?.reject || 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.admin?.rejectOpportunity || 'Reject Opportunity'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {'Are you sure you want to reject this opportunity? The recruiter will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.admin?.rejectionReason || 'Rejection reason (optional)'}
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t.admin?.rejectionReasonPlaceholder || 'Enter reason for rejection...'}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>
              {'Cancel'}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!!actionLoading}
            >
              {actionLoading
                ? ('Rejecting...')
                : (t.admin?.reject || 'Reject')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
