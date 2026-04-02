'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Connection, User, ApiResponse, PaginatedResponse } from '@/types';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConnections = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Connection>>>(
        '/connections',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setConnections(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPendingRequests = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Connection>>>(
        '/connections/pending',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setPendingRequests(res.data.data);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSentRequests = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Connection>>>(
        '/connections/sent',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setSentRequests(res.data.data);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (limit = 10) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ suggestions: User[] }>>(
        '/connections/suggestions',
        { params: { limit } }
      );
      if (res.success && res.data) {
        setSuggestions(res.data.suggestions);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (receiverId: string) => {
    const { data: res } = await api.post<ApiResponse>('/connections/request', { receiverId });
    return res;
  }, []);

  const respondToRequest = useCallback(async (connectionId: string, status: 'accepted' | 'rejected') => {
    const { data: res } = await api.patch<ApiResponse>(`/connections/${connectionId}`, { status });
    return res;
  }, []);

  const removeConnection = useCallback(async (connectionId: string) => {
    const { data: res } = await api.delete<ApiResponse>(`/connections/${connectionId}`);
    return res;
  }, []);

  const getConnectionStatus = useCallback(async (userId: string) => {
    const { data: res } = await api.get<ApiResponse<{ status: string }>>(`/connections/status/${userId}`);
    return res.data?.status;
  }, []);

  return {
    connections,
    pendingRequests,
    sentRequests,
    suggestions,
    total,
    totalPages,
    isLoading,
    fetchConnections,
    fetchPendingRequests,
    fetchSentRequests,
    fetchSuggestions,
    sendRequest,
    respondToRequest,
    removeConnection,
    getConnectionStatus,
  };
}
