'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'en', label: 'English' },
] as const;

export type Locale = 'en';

// Hardcoded translations for the application
const translations: Record<Locale, Record<string, any>> = {
  en: {
    language: 'Language',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    common: {
      success: 'Success',
      error: 'Error',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      no_data: 'No data found',
    },
    network: {
      title: 'My Network',
      connections: 'Connections',
      pendingRequests: 'Pending Requests',
      sentRequests: 'Sent Requests',
      suggestions: 'Suggestions',
      accept: 'Connection accepted',
      reject: 'Connection rejected',
      confirmRemove: 'Are you sure you want to remove this connection?',
      remove: 'Connection removed',
      connect: 'Connection request sent',
      noConnections: 'No connections yet',
      noPendingRequests: 'No pending requests',
      noSentRequests: 'No sent requests',
      noSuggestions: 'No suggestions available',
    },
    admin: {
      unknownAdmin: 'Unknown Admin',
      auditLog: 'Audit Log',
      filterByAction: 'Action Type',
      date: 'Date',
      adminCol: 'Admin',
      action: 'Action',
      targetType: 'Target Type',
      details: 'Details',
      ipAddress: 'IP Address',
      noAuditLogs: 'No audit logs found',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
    },
    opportunities: {
      title: 'Opportunities',
      create: 'Create Opportunity',
      edit: 'Edit Opportunity',
      view: 'View Opportunity',
      applications: 'Applications',
    },
    events: {
      title: 'Events',
      create: 'Create Event',
      edit: 'Edit Event',
      register: 'Register for Event',
      registered: 'Event registered successfully',
    },
    profile: {
      title: 'My Profile',
      edit: 'Edit Profile',
      saved: 'Profile saved successfully',
    },
    feed: {
      title: 'Feed',
      noPostsYet: 'No posts yet',
    },
  },
};

export function getLocale(): Locale {
  return 'en';
}

export function getTranslations(locale: Locale) {
  return translations[locale];
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
  };

  const t = getTranslations(locale);

  return { locale, setLocale, t };
}

export function LanguageSwitcher() {
  const { locale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            disabled
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
