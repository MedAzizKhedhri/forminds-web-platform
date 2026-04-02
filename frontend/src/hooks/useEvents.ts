'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Event, Registration, ApiResponse, PaginatedResponse } from '@/types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const listEvents = useCallback(async (
    filters: { type?: string; status?: string; search?: string } = {},
    page = 1,
    limit = 12
  ) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const { data: res } = await api.get<ApiResponse<{ events: Event[]; total: number }>>(
        '/events',
        { params }
      );
      if (res.success && res.data) {
        setEvents(res.data.events);
        setTotal(res.data.total);
        setTotalPages(Math.ceil(res.data.total / limit));
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEvent = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ event: Event }>>(
        `/events/${eventId}`
      );
      if (res.success && res.data) {
        setEvent(res.data.event);
      }
      return res;
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (data: Partial<Event>) => {
    const { data: res } = await api.post<ApiResponse<{ event: Event }>>(
      '/events',
      data
    );
    return res;
  }, []);

  const updateEvent = useCallback(async (eventId: string, data: Partial<Event>) => {
    const { data: res } = await api.patch<ApiResponse<{ event: Event }>>(
      `/events/${eventId}`,
      data
    );
    if (res.success && res.data) {
      setEvent(res.data.event);
    }
    return res;
  }, []);

  const cancelEvent = useCallback(async (eventId: string) => {
    const { data: res } = await api.patch<ApiResponse<{ event: Event }>>(
      `/events/${eventId}/cancel`
    );
    if (res.success && res.data) {
      setEvent(res.data.event);
    }
    return res;
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    const { data: res } = await api.delete<ApiResponse>(
      `/events/${eventId}`
    );
    if (res.success) {
      setEvent(null);
    }
    return res;
  }, []);

  const getOrganizerEvents = useCallback(async (page = 1, limit = 12) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ events: Event[]; total: number }>>(
        '/events/organizer/mine',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setEvents(res.data.events);
        setTotal(res.data.total);
        setTotalPages(Math.ceil(res.data.total / limit));
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerForEvent = useCallback(async (eventId: string) => {
    const { data: res } = await api.post<ApiResponse<{ registration: Registration }>>(
      `/events/${eventId}/register`
    );
    return res;
  }, []);

  const cancelRegistration = useCallback(async (eventId: string) => {
    const { data: res } = await api.delete<ApiResponse>(
      `/events/${eventId}/register`
    );
    return res;
  }, []);

  const getMyRegistration = useCallback(async (eventId: string) => {
    try {
      const { data: res } = await api.get<ApiResponse<{ registration: Registration }>>(
        `/events/${eventId}/my-registration`
      );
      if (res.success && res.data) {
        setRegistration(res.data.registration);
      }
      return res;
    } catch {
      setRegistration(null);
    }
  }, []);

  const getUserRegistrations = useCallback(async (page = 1, limit = 12) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ registrations: Registration[]; total: number }>>(
        '/events/registrations/mine',
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setRegistrations(res.data.registrations);
        setTotal(res.data.total);
        setTotalPages(Math.ceil(res.data.total / limit));
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkin = useCallback(async (eventId: string, qrCode: string) => {
    const { data: res } = await api.post<ApiResponse<{ registration: Registration }>>(
      `/events/${eventId}/checkin`,
      { qrCode }
    );
    return res;
  }, []);

  const getEventParticipants = useCallback(async (eventId: string, page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{ participants: Registration[]; total: number }>>(
        `/events/${eventId}/participants`,
        { params: { page, limit } }
      );
      if (res.success && res.data) {
        setParticipants(res.data.participants);
        setTotal(res.data.total);
        setTotalPages(Math.ceil(res.data.total / limit));
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    events,
    event,
    registrations,
    registration,
    participants,
    total,
    totalPages,
    isLoading,
    listEvents,
    getEvent,
    createEvent,
    updateEvent,
    cancelEvent,
    deleteEvent,
    getOrganizerEvents,
    registerForEvent,
    cancelRegistration,
    getMyRegistration,
    getUserRegistrations,
    checkin,
    getEventParticipants,
  };
}
