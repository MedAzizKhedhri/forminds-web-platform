'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Ticket, Calendar, MapPin, Clock, ArrowLeft,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

export default function MyRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { event, registration, isLoading, getEvent, getMyRegistration } = useEvents();
  const { user } = useAuth();
  const { t } = useLocale();
  useEffect(() => {
    if (id) {
      getEvent(id);
      if (user) getMyRegistration(id);
    }
  }, [id, user, getEvent, getMyRegistration]);

  if (isLoading || !event || !registration) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  const eventData = typeof registration.eventId === 'object' ? (registration.eventId as Event) : event;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-3">
        <Ticket className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">{t('events.viewTicket') || 'My Ticket'}</h1>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col items-center">
            {/* QR section */}
            <div className="w-full p-8 bg-primary/5 flex flex-col items-center justify-center border-b">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-primary/20 flex items-center justify-center p-3">
                <QRCodeSVG
                  value={registration.qrCode}
                  size={168}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="mt-3">
                {registration.checkedIn ? (
                  <Badge className="bg-green-100 text-green-800 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('events.checkedIn') || 'Checked In'}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {t('events.notCheckedIn') || 'Not Checked In'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Event info */}
            <div className="w-full p-6 space-y-3">
              <h3 className="text-xl font-semibold">{eventData.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(eventData.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{eventData.startTime} - {eventData.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{eventData.location}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
