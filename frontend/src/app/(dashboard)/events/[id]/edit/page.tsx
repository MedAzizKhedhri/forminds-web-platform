'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import EventForm from '@/components/events/EventForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreateEventFormData } from '@/lib/validations';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { event, isLoading, getEvent, updateEvent } = useEvents();
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const et = t.events || {};

  // Only recruiters can edit events
  useEffect(() => {
    if (user && user.role !== 'recruiter') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (id) getEvent(id);
  }, [id, getEvent]);

  const handleSubmit = async (data: CreateEventFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const res = await updateEvent(id, data);
      if (res?.success) {
        toast({ title: t.common?.success || 'Success', description: res.message });
        router.push(`/events/${id}`);
      }
    } catch {
      toast({ title: t.common?.error || 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !event) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>

      <div className="flex items-center gap-3">
        <Calendar className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">{et.edit || 'Edit Event'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            defaultValues={{
              title: event.title,
              description: event.description,
              type: event.type,
              location: event.location,
              date: event.date.split('T')[0],
              startTime: event.startTime,
              endTime: event.endTime,
              capacity: event.capacity,
              isOnline: event.isOnline,
              meetingUrl: event.meetingUrl || '',
              image: event.image || '',
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel={t.common?.save || 'Save'}
            translations={et}
          />
        </CardContent>
      </Card>
    </div>
  );
}
