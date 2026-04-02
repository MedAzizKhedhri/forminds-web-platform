'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { StudentProfile, RecruiterProfile, ApiResponse } from '@/types';

type ProfileData = StudentProfile | RecruiterProfile | null;

interface UseProfileReturn {
  profile: ProfileData;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  uploadCover: (file: File) => Promise<void>;
  deleteCover: () => Promise<void>;
  uploadCV: (file: File) => Promise<void>;
  deleteCV: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?._id;

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: res } = await api.get<ApiResponse<{ profile: ProfileData }>>(
        '/profiles/me'
      );

      if (res.success && res.data) {
        setProfile(res.data.profile);
      } else {
        setError(res.message || 'Failed to fetch profile');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    await api.post('/profiles/me/avatar', formData, {
      headers: { 'Content-Type': undefined },
    });

    await refreshUser();
  }, [refreshUser]);

  const deleteAvatar = useCallback(async () => {
    await api.delete('/profiles/me/avatar');
    await refreshUser();
  }, [refreshUser]);

  const uploadCover = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('cover', file);

    await api.post('/profiles/me/cover', formData, {
      headers: { 'Content-Type': undefined },
    });

    await refreshUser();
  }, [refreshUser]);

  const deleteCover = useCallback(async () => {
    await api.delete('/profiles/me/cover');
    await refreshUser();
  }, [refreshUser]);

  const uploadCV = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);

    await api.post('/profiles/me/cv', formData, {
      headers: { 'Content-Type': undefined },
    });

    await fetchProfile();
  }, [fetchProfile]);

  const deleteCV = useCallback(async () => {
    await api.delete('/profiles/me/cv');
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    uploadAvatar,
    deleteAvatar,
    uploadCover,
    deleteCover,
    uploadCV,
    deleteCV,
  };
}
