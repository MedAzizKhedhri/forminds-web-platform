'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import api from '@/lib/api';
import { setAccessToken, clearAccessToken } from '@/lib/auth';
import axios from 'axios';
import type { User, ApiResponse } from '@/types';
import type { RegisterFormData } from '@/lib/validations';

// ---------- State & Actions ----------

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

// ---------- Context ----------

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<ApiResponse<{ accessToken: string; user: User; requires2FA?: boolean }>>;
  register: (data: Omit<RegisterFormData, 'confirmPassword'>) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// ---------- Provider ----------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Try to restore session on mount
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        // Use raw axios (not the api instance) to avoid triggering the 401 interceptor
        const { data: refreshRes } = await axios.post<
          ApiResponse<{ accessToken: string }>
        >(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (cancelled) return;

        if (refreshRes.success && refreshRes.data?.accessToken) {
          setAccessToken(refreshRes.data.accessToken);

          // Fetch user profile
          const { data: meRes } = await api.get<ApiResponse<{ user: User }>>(
            '/auth/me'
          );

          if (cancelled) return;

          if (meRes.success && meRes.data) {
            dispatch({ type: 'SET_USER', payload: meRes.data.user });
            return;
          }
        }

        // If we get here, refresh failed
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch {
        if (!cancelled) {
          clearAccessToken();
          // Remove session hint cookie so middleware doesn't trap us in a redirect loop
          document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    }

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- login ----------
  const login = useCallback(
    async (email: string, password: string) => {
      const { data: res } = await api.post<
        ApiResponse<{ accessToken: string; user: User; requires2FA?: boolean }>
      >('/auth/login', { email, password });

      if (res.success && res.data) {
        if (res.data.requires2FA) {
          // Don't set user yet -- caller should redirect to 2FA page
          return res;
        }

        setAccessToken(res.data.accessToken);
        dispatch({ type: 'SET_USER', payload: res.data.user });
      }

      return res;
    },
    []
  );

  // ---------- register ----------
  const register = useCallback(
    async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
      const { data: res } = await api.post<ApiResponse>('/auth/register', data);
      return res;
    },
    []
  );

  // ---------- logout ----------
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      clearAccessToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // ---------- refreshUser ----------
  const refreshUser = useCallback(async () => {
    try {
      const { data: res } = await api.get<ApiResponse<{ user: User }>>('/auth/me');

      if (res.success && res.data) {
        dispatch({ type: 'SET_USER', payload: res.data.user });
      }
    } catch {
      clearAccessToken();
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // ---------- Memoised context value ----------
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshUser,
    }),
    [state, login, register, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
