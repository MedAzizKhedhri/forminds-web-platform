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
  Calendar,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import type { Event, User } from '@/types';

export default function AdminEventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const {
    pendingEvents,
    pagination,
    isLoading,
    fetchPendingEvents,
    validateEvent,
  } = useAdmin();

  const [currentPage, setCurrentPage] = useState(1);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const et = t.events || {};

  // Role guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  // Fetch pending events
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingEvents(1, 20);
    }
  }, [user, fetchPendingEvents]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPendingEvents(page, 20);
  };

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      const res = await validateEvent(eventId, 'approved');
      if (res.success) {
        toast({ title: t.admin?.eventApproved || 'Event approved successfully' });
      }
    } catch {
      toast({ title: t.common?.error || 'Action failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (eventId: string) => {
    setRejectTarget(eventId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget);
    try {
      const res = await validateEvent(rejectTarget, 'rejected', rejectionReason || undefined);
      if (res.success) {
        toast({ title: t.admin?.eventRejected || 'Event rejected' });
        setRejectDialogOpen(false);
      }
    } catch {
      toast({ title: t.common?.error || 'Action failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const getOrganizerName = (event: Event): string => {
    if (typeof event.organizerId === 'object' && event.organizerId !== null) {
      const organizer = event.organizerId as User;
      return `${organizer.firstName} ${organizer.lastName}`;
    }
    return 'Unknown';
  };

  const typeLabel = (type: string) => {
    const types = (et.types || {}) as Record<string, string>;
    return types[type] || type;
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
        <Calendar className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t.admin?.pendingEvents || 'Pending Events'}
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
      {!isLoading && pendingEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {t.admin?.noPendingEvents || 'No pending events'}
          </p>
          <p className="text-sm mt-1">
            All events have been reviewed
          </p>
        </div>
      )}

      {/* Event cards */}
      {!isLoading && pendingEvents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingEvents.map((event) => (
            <Card key={event._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge variant="secondary">{typeLabel(event.type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {event.description.length > 200
                    ? `${event.description.slice(0, 200)}...`
                    : event.description}
                </p>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {event.startTime} - {event.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {(et.capacity as string) || 'Capacity'}: {event.capacity}
                  </span>
                </div>

                {event.isOnline && (
                  <Badge variant="outline" className="text-xs">
                    {(et.isOnline as string) || 'Online'}
                  </Badge>
                )}

                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {(et.organizer as string) || 'Organizer'}:{' '}
                  </span>
                  <span className="font-medium">{getOrganizerName(event)}</span>
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => handleApprove(event._id)}
                    disabled={actionLoading === event._id}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t.admin?.approve || 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => openRejectDialog(event._id)}
                    disabled={actionLoading === event._id}
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
            {t.common?.back || 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
          >
            {t.common?.next || 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.admin?.rejectEvent || 'Reject Event'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this event? The organizer will be notified.
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
              {t.common?.cancel || 'Cancel'}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!!actionLoading}
            >
              {actionLoading ? '...' : (t.admin?.reject || 'Reject')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
