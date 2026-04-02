'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Globe, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Event, User } from '@/types';

const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/api$/, '');

interface EventCardProps {
  event: Event;
  translations?: Record<string, string | Record<string, string>>;
}

const typeColors: Record<string, string> = {
  conference: 'bg-blue-100 text-blue-800',
  workshop: 'bg-purple-100 text-purple-800',
  networking: 'bg-green-100 text-green-800',
  webinar: 'bg-orange-100 text-orange-800',
  career_fair: 'bg-pink-100 text-pink-800',
};

export default function EventCard({ event, translations }: EventCardProps) {
  const organizer = typeof event.organizerId === 'object' ? (event.organizerId as User) : null;
  const spotsLeft = event.capacity - event.registeredCount;
  const isFull = spotsLeft <= 0;
  const typeLabels = (translations?.types || {}) as Record<string, string>;
  const statusLabels = (translations?.status || {}) as Record<string, string>;

  return (
    <Link href={`/events/${event._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        {event.image ? (
          <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
            <img
              src={event.image.startsWith('http') ? event.image : `${SERVER_URL}${event.image}`}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeColors[event.type] || 'bg-gray-100 text-gray-800'}>
              {typeLabels[event.type] || event.type}
            </Badge>
            {event.status !== 'upcoming' && (
              <Badge variant={event.status === 'cancelled' ? 'destructive' : 'secondary'}>
                {statusLabels[event.status] || event.status}
              </Badge>
            )}
            {event.isOnline && (
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                Online
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{event.registeredCount}/{event.capacity}</span>
            </div>
            {isFull ? (
              <Badge variant="destructive" className="text-xs">
                {translations?.eventFull as string || 'Full'}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {spotsLeft} {translations?.spotsLeft as string || 'spots left'}
              </span>
            )}
          </div>

          {organizer && (
            <p className="text-xs text-muted-foreground truncate">
              {translations?.organizer as string || 'By'} {organizer.firstName} {organizer.lastName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
