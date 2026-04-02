'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/lib/api';
import type { Notification, ApiResponse, NotificationResponse } from '@/types';

const POLL_INTERVAL = 30000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<NotificationResponse>>(
        '/notifications',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch {
      // Error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: res } = await api.get<ApiResponse<{ unreadCount: number }>>(
        '/notifications/unread-count'
      );
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Silent fail for polling
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data: res } = await api.patch<ApiResponse<{ notification: Notification }>>(
        `/notifications/${notificationId}/read`
      );
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return res;
    } catch {
      // Error handled by interceptor
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: res } = await api.patch<ApiResponse<{ markedCount: number }>>(
        '/notifications/read-all'
      );
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
      return res;
    } catch {
      // Error handled by interceptor
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { data: res } = await api.delete<ApiResponse>(`/notifications/${notificationId}`);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        setTotal((prev) => prev - 1);
      }
      return res;
    } catch {
      // Error handled by interceptor
    }
  }, []);

  // Start polling for unread count
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLL_INTERVAL);
  }, [fetchUnreadCount]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    notifications,
    unreadCount,
    total,
    totalPages,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  };
}
