'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface OpportunityFiltersProps {
  onFilterChange: (filters: { type?: string; location?: string; domain?: string }) => void;
}

export function OpportunityFilters({ onFilterChange }: OpportunityFiltersProps) {
  const { t } = useLocale();
  const [type, setType] = useState<string>('');
  const [location, setLocation] = useState('');
  const [domain, setDomain] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef = useRef(type);
  const locationRef = useRef(location);
  const domainRef = useRef(domain);

  const emitFilters = useCallback(
    () => {
      const filters: { type?: string; location?: string; domain?: string } = {};
      if (typeRef.current) filters.type = typeRef.current;
      if (locationRef.current) filters.location = locationRef.current;
      if (domainRef.current) filters.domain = domainRef.current;
      onFilterChange(filters);
    },
    [onFilterChange]
  );

  const debouncedEmit = useCallback(
    () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        emitFilters();
      }, 300);
    },
    [emitFilters]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleTypeChange = (value: string) => {
    const newType = value === 'all' ? '' : value;
    setType(newType);
    typeRef.current = newType;
    emitFilters();
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    locationRef.current = value;
    debouncedEmit();
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    domainRef.current = value;
    debouncedEmit();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={type || 'all'} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('opportunities.filterType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.search')}</SelectItem>
          <SelectItem value="stage">{t('opportunities.stage')}</SelectItem>
          <SelectItem value="emploi">{t('opportunities.emploi')}</SelectItem>
          <SelectItem value="benevolat">{t('opportunities.benevolat')}</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder={t('opportunities.filterLocation')}
        value={location}
        onChange={(e) => handleLocationChange(e.target.value)}
        className="w-full sm:w-[200px]"
      />

      <Input
        placeholder={t('opportunities.filterDomain')}
        value={domain}
        onChange={(e) => handleDomainChange(e.target.value)}
        className="w-full sm:w-[200px]"
      />
    </div>
  );
}
