'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConnectionStatusBadge } from '@/components/network/ConnectionStatusBadge';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Loader2, UserPlus, UserMinus, Check, X } from 'lucide-react';
import type { Connection, User } from '@/types';

interface ConnectionCardProps {
  connection: Connection;
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  onConnect?: () => void;
  variant: 'received' | 'sent' | 'accepted' | 'suggestion';
  isLoading?: boolean;
  currentUserId?: string;
}

function getUser(connection: Connection, variant: ConnectionCardProps['variant'], currentUserId?: string): User | null {
  if (variant === 'received') {
    // Show the sender (the person who sent the request to me)
    return typeof connection.senderId === 'object' ? connection.senderId : null;
  }

  if (variant === 'sent') {
    // Show the receiver (the person I sent the request to)
    return typeof connection.receiverId === 'object' ? connection.receiverId : null;
  }

  if (variant === 'accepted') {
    // Show the OTHER person, not myself
    const sender = typeof connection.senderId === 'object' ? connection.senderId : null;
    const receiver = typeof connection.receiverId === 'object' ? connection.receiverId : null;

    if (currentUserId && sender && sender._id === currentUserId) {
      return receiver;
    }
    if (currentUserId && receiver && receiver._id === currentUserId) {
      return sender;
    }
    return receiver || sender;
  }

  // For suggestion variant
  if (typeof connection.senderId === 'object') return connection.senderId;
  if (typeof connection.receiverId === 'object') return connection.receiverId;
  return null;
}

function getInitials(user: User): string {
  return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
}

export function ConnectionCard({
  connection,
  onAccept,
  onReject,
  onRemove,
  onConnect,
  variant,
  isLoading = false,
  currentUserId,
}: ConnectionCardProps) {
  const { t } = useLocale();
  const user = getUser(connection, variant, currentUserId);

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;
  const headline = (user as User & { headline?: string }).headline;

  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/10">
      <CardContent className="flex flex-col items-center gap-3 p-6">
        <Avatar className="h-16 w-16 ring-2 ring-background shadow-sm">
          {user.avatar && <AvatarImage src={user.avatar} alt={fullName} />}
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-1 text-center">
          <Link
            href={`/p/${user.username}`}
            className="text-sm font-semibold hover:underline"
          >
            {fullName}
          </Link>
          {headline && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {headline}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 w-full justify-center">
          {variant === 'received' && (
            <>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1 h-4 w-4" />
                )}
                {t('network.accept')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-1 h-4 w-4" />
                )}
                {t('network.reject')}
              </Button>
            </>
          )}

          {variant === 'accepted' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRemove}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="mr-1 h-4 w-4" />
              )}
              {t('network.remove')}
            </Button>
          )}

          {variant === 'sent' && (
            <ConnectionStatusBadge status="pending" />
          )}

          {variant === 'suggestion' && (
            <Button
              size="sm"
              onClick={onConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-1 h-4 w-4" />
              )}
              {t('network.connect')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
