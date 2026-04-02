'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Application, ApiResponse, PaginatedResponse } from '@/types';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    pending: 0, reviewed: 0, shortlisted: 0, accepted: 0, rejected: 0,
  });

  const apply = useCallback(async (opportunityId: string, coverLetter?: string) => {
    const { data: res } = await api.post<ApiResponse<{ application: Application }>>(
      '/applications',
      { opportunityId, coverLetter }
    );
    return res;
  }, []);

  const getMyApplications = useCallback(async (page = 1, limit = 12) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Application>>>(
        '/applications/mine',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setApplications(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOpportunityApplications = useCallback(async (opportunityId: string, page = 1, limit = 12) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Application>>>(
        `/applications/opportunity/${opportunityId}`,
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setApplications(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecruiterApplications = useCallback(async (
    filters: { status?: string; search?: string; opportunityId?: string } = {},
    page = 1,
    limit = 20
  ) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.opportunityId) params.opportunityId = filters.opportunityId;

      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Application> & { statusCounts: Record<string, number> }>>(
        '/applications/recruiter',
        { params }
      );
      if (res.success && res.data) {
        setApplications(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        if (res.data.statusCounts) {
          setStatusCounts(res.data.statusCounts);
        }
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: Application['status']) => {
    const { data: res } = await api.patch<ApiResponse>(
      `/applications/${applicationId}/status`,
      { status }
    );
    if (res.success) {
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, status } : a))
      );
    }
    return res;
  }, []);

  return {
    applications,
    total,
    totalPages,
    statusCounts,
    isLoading,
    apply,
    getMyApplications,
    getOpportunityApplications,
    getRecruiterApplications,
    updateApplicationStatus,
  };
}
