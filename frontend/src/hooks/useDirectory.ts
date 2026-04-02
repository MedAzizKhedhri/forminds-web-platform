'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types';

interface DirectoryProfile {
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
  domain?: string;
  connectionStatus?: string | null;
}

interface DirectoryFilters {
  skills?: string;
  domain?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export function useDirectory() {
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const searchProfiles = useCallback(async (filters: DirectoryFilters = {}) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filters.skills) params.skills = filters.skills;
      if (filters.domain) params.domain = filters.domain;
      if (filters.city) params.city = filters.city;
      params.page = filters.page || 1;
      params.limit = filters.limit || 12;

      const { data: res } = await api.get<ApiResponse<PaginatedResponse<DirectoryProfile>>>(
        '/profiles/directory',
        { params }
      );
      if (res.success && res.data) {
        setProfiles(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { profiles, total, totalPages, isLoading, searchProfiles };
}
