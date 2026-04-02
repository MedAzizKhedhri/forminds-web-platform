'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface DirectoryFiltersProps {
  onFilterChange: (filters: { skills?: string; domain?: string; city?: string }) => void;
  initialFilters?: { skills?: string; domain?: string; city?: string };
}

export function DirectoryFilters({ onFilterChange, initialFilters }: DirectoryFiltersProps) {
  const { t } = useLocale();
  const [skills, setSkills] = useState(initialFilters?.skills || '');
  const [domain, setDomain] = useState(initialFilters?.domain || '');
  const [city, setCity] = useState(initialFilters?.city || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillsRef = useRef(skills);
  const domainRef = useRef(domain);
  const cityRef = useRef(city);

  const debouncedFilterChange = useCallback(
    () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onFilterChange({ skills: skillsRef.current, domain: domainRef.current, city: cityRef.current });
      }, 300);
    },
    [onFilterChange]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSkillsChange = (value: string) => {
    setSkills(value);
    skillsRef.current = value;
    debouncedFilterChange();
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    domainRef.current = value;
    debouncedFilterChange();
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    cityRef.current = value;
    debouncedFilterChange();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="filter-skills">
          {t.directory?.filterSkills || 'Skills'}
        </Label>
        <Input
          id="filter-skills"
          placeholder={t.directory?.searchPlaceholder || 'Search...'}
          value={skills}
          onChange={(e) => handleSkillsChange(e.target.value)}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="filter-domain">
          {t.directory?.filterDomain || 'Domain'}
        </Label>
        <Input
          id="filter-domain"
          placeholder={t.directory?.searchPlaceholder || 'Search...'}
          value={domain}
          onChange={(e) => handleDomainChange(e.target.value)}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="filter-city">
          {t.directory?.filterCity || 'City'}
        </Label>
        <Input
          id="filter-city"
          placeholder={t.directory?.searchPlaceholder || 'Search...'}
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
        />
      </div>
    </div>
  );
}
