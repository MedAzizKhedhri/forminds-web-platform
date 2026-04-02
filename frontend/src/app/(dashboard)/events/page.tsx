'use client';

import { useEffect, useState } from 'react';
import { Search, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import EventCard from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
  const { events = [], total, totalPages, isLoading, listEvents } = useEvents();
  const { user } = useAuth();
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const et = t.events || {};
  const canCreate = user?.role === 'recruiter'; // Only recruiters can create events

  useEffect(() => {
    listEvents({ search, type: typeFilter || undefined }, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, listEvents]);

  const handleSearch = () => {
    setPage(1);
    listEvents({ search, type: typeFilter || undefined }, 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">{et.title || 'Events'}</h1>
        </div>
        {canCreate && (
          <Link href="/events/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {et.create || 'Create Event'}
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.common?.search || 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={et.type || 'Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common?.noResults ? 'All' : 'All'}</SelectItem>
            {['conference', 'workshop', 'networking', 'webinar', 'career_fair'].map((type) => (
              <SelectItem key={type} value={type}>
                {(et.types as Record<string, string>)?.[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>{t.common?.search || 'Search'}</Button>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-lg" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{et.noEvents || 'No events found'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} translations={et} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t.common?.back || 'Previous'}
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {page} / {totalPages} ({total})
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t.common?.next || 'Next'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
