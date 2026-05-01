'use client';

import Link from 'next/link';
import { MapPin, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface ProfileDirectoryCardProps {
  profile: {
    _id: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
      avatar?: string;
    };
    headline?: string;
    skills: string[];
    location?: string;
  };
  onConnect?: (userId: string) => void;
  connectionStatus?: string;
}

export function ProfileDirectoryCard({
  profile,
  onConnect,
  connectionStatus,
}: ProfileDirectoryCardProps) {
  const { t } = useLocale();
  const { userId, headline, skills, location } = profile;
  const fullName = `${userId.firstName} ${userId.lastName}`;
  const initials = `${userId.firstName.charAt(0)}${userId.lastName.charAt(0)}`.toUpperCase();

  const maxSkills = 5;
  const visibleSkills = skills.slice(0, maxSkills);
  const remainingCount = skills.length - maxSkills;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userId.avatar || undefined} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              href={`/p/${userId.username}`}
              className="text-base font-semibold hover:underline hover:text-primary truncate block"
            >
              {fullName}
            </Link>
            {headline && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {headline}
              </p>
            )}
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map((skill, i) => (
              <Badge key={`${skill}-${i}`} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        )}

        {connectionStatus !== 'accepted' && onConnect && (
          <Button
            variant={connectionStatus === 'pending' ? 'outline' : 'default'}
            size="sm"
            className="w-full"
            disabled={connectionStatus === 'pending'}
            onClick={() => onConnect(userId._id)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {connectionStatus === 'pending'
              ? (t('network.pending'))
              : (t('network.connect'))}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
