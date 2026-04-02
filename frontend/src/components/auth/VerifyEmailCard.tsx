'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type VerifyState = 'loading' | 'success' | 'error';

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!token || !email) {
      setState('error');
      setMessage('Invalid verification link. Token or email is missing.');
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const { data: res } = await api.post<ApiResponse>(
          '/auth/verify-email',
          { token, email }
        );

        if (cancelled) return;

        if (res.success) {
          setState('success');
          setMessage(
            res.message || 'Your email has been verified successfully!'
          );
        } else {
          setState('error');
          setMessage(res.message || 'Verification failed. Please try again.');
        }
      } catch (error: unknown) {
        if (cancelled) return;

        const msg =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          'An unexpected error occurred during verification.';

        setState('error');
        setMessage(msg);
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, email]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Email verification</CardTitle>
      </CardHeader>

      <CardContent>
        {state === 'loading' && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <CardDescription className="text-center">
              Verifying your email address...
            </CardDescription>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardDescription className="text-center text-base">
              {message}
            </CardDescription>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <CardDescription className="text-center text-base text-destructive">
              {message}
            </CardDescription>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        {state !== 'loading' && (
          <Button asChild variant="outline">
            <Link href="/login">Go to login</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
