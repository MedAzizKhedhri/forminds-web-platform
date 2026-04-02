'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import EventForm from '@/components/events/EventForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateEventFormData } from '@/lib/validations';

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const et = t.events || {};

  // Only recruiters can create events
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== 'recruiter') {
      router.replace('/dashboard');
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || (user && user.role !== 'recruiter')) {
    return null;
  }

  const handleSubmit = async (data: CreateEventFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        meetingUrl: data.meetingUrl || undefined,
        image: data.image || undefined,
      };
      const res = await createEvent(payload);
      if (res?.success) {
        toast({ title: t.common?.success || 'Success', description: res.message });
        router.push('/events/mine');
      }
    } catch {
      toast({ title: t.common?.error || 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>

      <div className="flex items-center gap-3">
        <Calendar className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">{et.create || 'Create Event'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{et.create || 'New Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel={et.create || 'Create Event'}
            translations={et}
          />
        </CardContent>
      </Card>
    </div>
  );
}
