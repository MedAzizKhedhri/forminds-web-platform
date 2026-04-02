'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Opportunity, ApiResponse, PaginatedResponse } from '@/types';

interface OpportunityFilters {
  type?: string;
  location?: string;
  domain?: string;
  page?: number;
  limit?: number;
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const searchOpportunities = useCallback(async (filters: OpportunityFilters = {}) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filters.type) params.type = filters.type;
      if (filters.location) params.location = filters.location;
      if (filters.domain) params.domain = filters.domain;
      params.page = filters.page || 1;
      params.limit = filters.limit || 12;

      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Opportunity>>>(
        '/opportunities',
        { params }
      );
      if (res.success && res.data) {
        setOpportunities(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOpportunity = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ opportunity: Opportunity }>>(
        `/opportunities/${id}`
      );
      if (res.success && res.data) {
        setOpportunity(res.data.opportunity);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMyOpportunities = useCallback(async (page = 1, limit = 12) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Opportunity>>>(
        '/opportunities/mine',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setOpportunities(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOpportunity = useCallback(async (data: Partial<Opportunity>) => {
    const { data: res } = await api.post<ApiResponse<{ opportunity: Opportunity }>>(
      '/opportunities',
      data
    );
    return res;
  }, []);

  const updateOpportunity = useCallback(async (id: string, data: Partial<Opportunity>) => {
    const { data: res } = await api.patch<ApiResponse<{ opportunity: Opportunity }>>(
      `/opportunities/${id}`,
      data
    );
    return res;
  }, []);

  const closeOpportunity = useCallback(async (id: string) => {
    const { data: res } = await api.patch<ApiResponse>(`/opportunities/${id}/close`);
    if (res.success) {
      setOpportunities((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'closed' as const } : o))
      );
      if (opportunity?._id === id) {
        setOpportunity({ ...opportunity, status: 'closed' });
      }
    }
    return res;
  }, [opportunity]);

  const reopenOpportunity = useCallback(async (id: string) => {
    const { data: res } = await api.patch<ApiResponse>(`/opportunities/${id}/reopen`);
    if (res.success) {
      setOpportunities((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'pending' as const } : o))
      );
      if (opportunity?._id === id) {
        setOpportunity({ ...opportunity, status: 'pending' });
      }
    }
    return res;
  }, [opportunity]);

  const deleteOpportunity = useCallback(async (id: string) => {
    const { data: res } = await api.delete<ApiResponse>(`/opportunities/${id}`);
    if (res.success) {
      setOpportunities((prev) => prev.filter((o) => o._id !== id));
      if (opportunity?._id === id) {
        setOpportunity(null);
      }
    }
    return res;
  }, [opportunity]);

  return {
    opportunities,
    opportunity,
    total,
    totalPages,
    isLoading,
    searchOpportunities,
    getOpportunity,
    getMyOpportunities,
    createOpportunity,
    updateOpportunity,
    closeOpportunity,
    reopenOpportunity,
    deleteOpportunity,
  };
}
