'use client';

import { useEffect } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ConnectionList } from '@/components/network/ConnectionList';
import { PendingRequestList } from '@/components/network/PendingRequestList';
import { ConnectionCard } from '@/components/network/ConnectionCard';
import { SuggestionList } from '@/components/network/SuggestionList';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Inbox } from 'lucide-react';

function SentRequestsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-6 w-16 mt-2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NetworkPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const {
    connections,
    pendingRequests,
    sentRequests,
    suggestions,
    isLoading,
    fetchConnections,
    fetchPendingRequests,
    fetchSentRequests,
    fetchSuggestions,
    sendRequest,
    respondToRequest,
    removeConnection,
  } = useConnections();

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
    fetchSentRequests();
    fetchSuggestions();
  }, [fetchConnections, fetchPendingRequests, fetchSentRequests, fetchSuggestions]);

  const handleAccept = async (connectionId: string) => {
    try {
      const res = await respondToRequest(connectionId, 'accepted');
      if (res.success) {
        toast({ title: t('common.success'), description: t('network.accept') });
        fetchPendingRequests();
        fetchConnections();
      }
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      const res = await respondToRequest(connectionId, 'rejected');
      if (res.success) {
        toast({ title: t('common.success'), description: t('network.reject') });
        fetchPendingRequests();
      }
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleRemove = async (connectionId: string) => {
    if (!confirm(t('network.confirmRemove'))) return;
    try {
      const res = await removeConnection(connectionId);
      if (res.success) {
        toast({ title: t('common.success'), description: t('network.remove') });
        fetchConnections();
      }
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      const res = await sendRequest(userId);
      if (res.success) {
        toast({ title: t('common.success'), description: t('network.connect') });
        fetchSuggestions();
        fetchSentRequests();
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message = axiosErr.response?.data?.message || t('common.error');
      toast({ title: t('common.error'), description: message, variant: 'destructive' });
      fetchSuggestions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">{t('network.title')}</h1>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="connections">
            {t('network.connections')}
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            {t('network.pendingRequests')}
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            {t('network.sentRequests')}
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            {t('network.suggestions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          <ConnectionList
            connections={connections}
            isLoading={isLoading}
            onRemove={handleRemove}
            currentUserId={user?._id ?? ''}
          />
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <PendingRequestList
            requests={pendingRequests}
            isLoading={isLoading}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {isLoading ? (
            <SentRequestsSkeleton />
          ) : sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">{t('network.noPending')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sentRequests.map((request) => (
                <ConnectionCard
                  key={request._id}
                  connection={request}
                  variant="sent"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <SuggestionList
            suggestions={suggestions}
            isLoading={isLoading}
            onConnect={handleConnect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
