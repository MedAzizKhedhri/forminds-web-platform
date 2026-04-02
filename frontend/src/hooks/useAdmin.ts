'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type {
  AdminStats,
  AuditLog,
  Event,
  Opportunity,
  User,
  RecruiterProfile,
  ApiResponse,
} from '@/types';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type PopulatedRecruiter = Omit<RecruiterProfile, 'userId'> & { userId: User | string };

export function useAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingOpportunities, setPendingOpportunities] = useState<Opportunity[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [unverifiedRecruiters, setUnverifiedRecruiters] = useState<PopulatedRecruiter[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ stats: AdminStats }>>('/admin/stats');
      if (res.success && res.data) {
        setStats(res.data.stats);
      }
    } catch { /* handled by interceptor */ }
    finally { setIsLoading(false); }
  }, []);

  const fetchPendingOpportunities = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{
        opportunities: Opportunity[];
        pagination: PaginationData;
      }>>('/admin/opportunities', { params: { page, limit } });
      if (res.success && res.data) {
        setPendingOpportunities(res.data.opportunities);
        setPagination(res.data.pagination);
      }
    } catch { /* handled by interceptor */ }
    finally { setIsLoading(false); }
  }, []);

  const validateOpportunity = useCallback(async (
    opportunityId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    const { data: res } = await api.patch<ApiResponse<{ opportunity: Opportunity }>>(
      `/admin/opportunities/${opportunityId}`,
      { status, rejectionReason }
    );
    if (res.success) {
      setPendingOpportunities((prev) => prev.filter((o) => o._id !== opportunityId));
    }
    return res;
  }, []);

  const fetchPendingEvents = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{
        events: Event[];
        pagination: PaginationData;
      }>>('/admin/events', { params: { page, limit } });
      if (res.success && res.data) {
        setPendingEvents(res.data.events);
        setPagination(res.data.pagination);
      }
    } catch { /* handled by interceptor */ }
    finally { setIsLoading(false); }
  }, []);

  const validateEvent = useCallback(async (
    eventId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    const { data: res } = await api.patch<ApiResponse<{ event: Event }>>(
      `/admin/events/${eventId}`,
      { status, rejectionReason }
    );
    if (res.success) {
      setPendingEvents((prev) => prev.filter((e) => e._id !== eventId));
    }
    return res;
  }, []);

  const fetchUnverifiedRecruiters = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{
        recruiters: PopulatedRecruiter[];
        pagination: PaginationData;
      }>>('/admin/recruiters', { params: { page, limit } });
      if (res.success && res.data) {
        setUnverifiedRecruiters(res.data.recruiters);
        setPagination(res.data.pagination);
      }
    } catch { /* handled by interceptor */ }
    finally { setIsLoading(false); }
  }, []);

  const verifyRecruiter = useCallback(async (userId: string) => {
    const { data: res } = await api.patch<ApiResponse>(
      `/admin/recruiters/${userId}/verify`,
      { verified: true }
    );
    if (res.success) {
      setUnverifiedRecruiters((prev) => prev.filter((r) => {
        const rUserId = typeof r.userId === 'string' ? r.userId : r.userId._id;
        return rUserId !== userId;
      }));
    }
    return res;
  }, []);

  const fetchAuditLogs = useCallback(async (
    filters: { action?: string } = {},
    page = 1,
    limit = 50
  ) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filters.action) params.action = filters.action;
      const { data: res } = await api.get<ApiResponse<{
        logs: AuditLog[];
        pagination: PaginationData;
      }>>('/admin/audit-log', { params });
      if (res.success && res.data) {
        setAuditLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch { /* handled by interceptor */ }
    finally { setIsLoading(false); }
  }, []);

  const fetchUsers = useCallback(async (
    filters: { role?: string; status?: string; search?: string } = {},
    page = 1,
    limit = 20
  ) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const { data: res } = await api.get<ApiResponse<{
        users: User[];
        pagination: PaginationData;
      }>>('/users', { params });
      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch { /* handled by interceptor */ }
    finally { setIsLoading(false); }
  }, []);

  const updateUserStatus = useCallback(async (
    userId: string,
    isActive: boolean,
    reason?: string
  ) => {
    const { data: res } = await api.patch<ApiResponse<{ user: User }>>(
      `/users/${userId}/status`,
      { isActive, reason }
    );
    if (res.success && res.data) {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive } : u))
      );
    }
    return res;
  }, []);

  return {
    stats,
    pendingOpportunities,
    pendingEvents,
    unverifiedRecruiters,
    auditLogs,
    users,
    pagination,
    isLoading,
    fetchStats,
    fetchPendingOpportunities,
    validateOpportunity,
    fetchPendingEvents,
    validateEvent,
    fetchUnverifiedRecruiters,
    verifyRecruiter,
    fetchAuditLogs,
    fetchUsers,
    updateUserStatus,
  };
}
