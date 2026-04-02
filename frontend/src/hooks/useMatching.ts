'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { MatchResult, DetailedMatchResult, Opportunity, ApiResponse } from '@/types';

export function useMatching() {
  const [recommendations, setRecommendations] = useState<MatchResult[]>([]);
  const [matchDetail, setMatchDetail] = useState<{
    opportunity: Opportunity;
    matching: DetailedMatchResult;
  } | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const getRecommendations = useCallback(async (limit = 10) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{
        recommendations: MatchResult[];
        total: number;
      }>>(
        '/matching/recommendations',
        { params: { limit } }
      );
      if (res.success && res.data) {
        setRecommendations(res.data.recommendations);
        setTotal(res.data.total);
      }
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMatchScore = useCallback(async (opportunityId: string) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<{
        opportunity: Opportunity;
        matching: DetailedMatchResult;
      }>>(
        `/matching/score/${opportunityId}`
      );
      if (res.success && res.data) {
        setMatchDetail(res.data);
      }
      return res;
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommendations,
    matchDetail,
    total,
    isLoading,
    getRecommendations,
    getMatchScore,
  };
}
