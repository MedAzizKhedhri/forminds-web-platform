'use client';

import { useEffect, useState } from 'react';
import { Ticket, Calendar, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEvents } from '@/hooks/useEvents';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

export default function MyTicketsPage() {
  const { registrations, total, totalPages, isLoading, getUserRegistrations } = useEvents();
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const typeLabels = (t('events.types', { returnObjects: true }) || {}) as Record<string, string>;

  useEffect(() => {
    getUserRegistrations(page);
  }, [page, getUserRegistrations]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Ticket className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">{t('events.myTickets') || 'My Tickets'}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : !registrations || registrations.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t('events.noTickets') || 'No tickets yet'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {registrations.map((reg) => {
              const event = typeof reg.eventId === 'object' ? (reg.eventId as Event) : null;
              if (!event) return null;

              return (
                <Card key={reg._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Left: QR section */}
                      <div className="sm:w-48 p-6 bg-primary/5 flex flex-col items-center justify-center border-r">
                        <div className="w-32 h-32 bg-white rounded-lg border-2 border-primary/20 flex items-center justify-center p-2">
                          <QRCodeSVG
                            value={reg.qrCode}
                            size={112}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <div className="mt-2">
                          {reg.checkedIn ? (
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

                      {/* Right: Event info */}
                      <div className="flex-1 p-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${event.type ? (({
                            conference: 'bg-blue-100 text-blue-800',
                            workshop: 'bg-purple-100 text-purple-800',
                            networking: 'bg-green-100 text-green-800',
                            webinar: 'bg-orange-100 text-orange-800',
                            career_fair: 'bg-pink-100 text-pink-800',
                          })[event.type] || '') : ''
                            }`}>
                            {typeLabels[event.type] || event.type}
                          </Badge>
                          {event.status === 'cancelled' && (
                            <Badge variant="destructive">
                              {t('events.status.cancelled')}
                            </Badge>
                          )}

                        </div>
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.back')}
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {page} / {totalPages} ({total})
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
