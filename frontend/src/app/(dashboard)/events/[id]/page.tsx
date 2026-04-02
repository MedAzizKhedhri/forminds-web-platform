'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar, MapPin, Clock, Users, Globe, ArrowLeft,
  UserCheck, UserX, ExternalLink, Image as ImageIcon, Trash2,
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';

const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/api$/, '');
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { User } from '@/types';

const typeColors: Record<string, string> = {
  conference: 'bg-blue-100 text-blue-800',
  workshop: 'bg-purple-100 text-purple-800',
  networking: 'bg-green-100 text-green-800',
  webinar: 'bg-orange-100 text-orange-800',
  career_fair: 'bg-pink-100 text-pink-800',
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { event, registration, isLoading, getEvent, registerForEvent, cancelRegistration, getMyRegistration, cancelEvent, deleteEvent } = useEvents();
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  const et = (t.events || {}) as typeof t.events & { deleteEvent?: string; confirmDelete?: string };
  const typeLabels = (et.types || {}) as Record<string, string>;
  const statusLabels = (et.status || {}) as Record<string, string>;

  useEffect(() => {
    if (id) {
      getEvent(id);
      if (user) getMyRegistration(id);
    }
  }, [id, user, getEvent, getMyRegistration]);

  const organizer = event && typeof event.organizerId === 'object' ? (event.organizerId as User) : null;
  const isOrganizer = organizer && user && organizer._id === user._id;
  const isRegistered = registration && registration.status === 'registered';
  const spotsLeft = event ? event.capacity - event.registeredCount : 0;

  const handleRegister = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await registerForEvent(id);
      if (res?.success) {
        toast({ title: t.common?.success || 'Success', description: res.message });
        getEvent(id);
        getMyRegistration(id);
      }
    } catch {
      toast({ title: t.common?.error || 'Error', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await cancelRegistration(id);
      if (res?.success) {
        toast({ title: t.common?.success || 'Success', description: res.message });
        getEvent(id);
        getMyRegistration(id);
      }
    } catch {
      toast({ title: t.common?.error || 'Error', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await cancelEvent(id);
      if (res?.success) {
        toast({ title: t.common?.success || 'Success', description: res.message });
        getEvent(id);
      }
    } catch {
      toast({ title: t.common?.error || 'Error', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await deleteEvent(id);
      if (res?.success) {
        toast({ title: t.common?.success || 'Success', description: res.message });
        router.push('/events/mine');
      }
    } catch {
      toast({ title: t.common?.error || 'Error', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !event) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>

      {/* Event Image */}
      {event.image ? (
        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
          <img src={event.image.startsWith('http') ? event.image : `${SERVER_URL}${event.image}`} alt={event.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <ImageIcon className="h-20 w-20 text-muted-foreground/20" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={typeColors[event.type] || 'bg-gray-100 text-gray-800'}>
            {typeLabels[event.type] || event.type}
          </Badge>
          <Badge variant={event.status === 'cancelled' ? 'destructive' : 'secondary'}>
            {statusLabels[event.status] || event.status}
          </Badge>
          {event.isOnline && (
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {et.online || 'Online'}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold">{event.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>

          {event.isOnline && event.meetingUrl && isRegistered && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-primary" />
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {et.meetingUrl || 'Join Meeting'}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{event.startTime} - {event.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{event.registeredCount} / {event.capacity}</span>
              </div>
              {organizer && (
                <div className="pt-2 border-t text-muted-foreground">
                  <span className="font-medium">{et.organizer || 'Organizer'}:</span>{' '}
                  {organizer.firstName} {organizer.lastName}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {event.status === 'upcoming' && (
            <div className="space-y-2">
              {/* Registration buttons for students and recruiters only (not admin, not organizer) */}
              {!isOrganizer && user?.role !== 'admin' && (
                <>
                  {isRegistered ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/events/${event._id}/my-registration`)}>
                        <UserCheck className="h-4 w-4" />
                        {et.viewTicket || 'View Ticket'}
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={handleCancelRegistration}
                        disabled={actionLoading}
                      >
                        <UserX className="h-4 w-4" />
                        {et.cancelRegistration || 'Cancel Registration'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleRegister}
                      disabled={actionLoading || spotsLeft <= 0}
                    >
                      {spotsLeft <= 0
                        ? (et.eventFull || 'Event is full')
                        : (et.register || 'Register')}
                    </Button>
                  )}
                </>
              )}

              {/* CRUD buttons only for organizer (not admin) */}
              {isOrganizer && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/events/${event._id}/edit`)}
                  >
                    {t.common?.edit || 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/events/${event._id}/checkin`)}
                  >
                    {et.scanQR || 'Scan QR Code'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        {et.cancelEvent || 'Cancel Event'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{et.cancelEvent || 'Cancel Event'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {et.confirmCancel || 'Are you sure you want to cancel this event?'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common?.cancel || 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelEvent}>
                          {t.common?.confirm || 'Confirm'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          )}

          {/* Delete button for cancelled events (organizer only) */}
          {event.status === 'cancelled' && isOrganizer && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2" disabled={actionLoading}>
                  <Trash2 className="h-4 w-4" />
                  {et.deleteEvent || 'Delete Event'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{et.deleteEvent || 'Delete Event'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {et.confirmDelete || 'Are you sure you want to permanently delete this event? This action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common?.cancel || 'Cancel'}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteEvent}>
                    {t.common?.confirm || 'Confirm'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
