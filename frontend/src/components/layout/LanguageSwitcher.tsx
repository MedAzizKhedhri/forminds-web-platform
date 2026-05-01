'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

export type Locale = 'en' | 'fr';

/**
 * Drop-in replacement for the old useLocale() hook.
 * Now powered by react-i18next under the hood.
 * Usage: const { t, locale, setLocale } = useLocale();
 *        t('nav.dashboard')   // returns translated string
 */
export function useLocale() {
  const { t, i18n } = useTranslation();

  const locale = (i18n.language?.startsWith('fr') ? 'fr' : 'en') as Locale;

  const setLocale = (l: Locale) => {
    i18n.changeLanguage(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('for-minds-locale', l);
      document.documentElement.lang = l;
    }
  };

  return { locale, setLocale, t };
}

export function LanguageSwitcher({ onLocaleChange }: { onLocaleChange?: () => void }) {
  const { locale, setLocale } = useLocale();

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
            onClick={() => {
              setLocale(lang.code as Locale);
              if (onLocaleChange) onLocaleChange();
            }}
            className={locale === lang.code ? 'bg-accent cursor-pointer' : 'cursor-pointer'}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
