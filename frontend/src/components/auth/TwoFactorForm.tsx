'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { twoFactorSchema, type TwoFactorFormData } from '@/lib/validations';
import api from '@/lib/api';
import { setAccessToken } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { ApiResponse, User } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      email,
      code: '',
    },
  });

  async function onSubmit(formData: TwoFactorFormData) {
    setIsSubmitting(true);

    try {
      const { data: res } = await api.post<
        ApiResponse<{ accessToken: string; user: User }>
      >('/auth/verify-2fa', formData);

      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);

        // Refresh user in auth context
        await refreshUser();

        toast({
          title: 'Verified',
          description: res.message || 'Two-factor authentication successful!',
        });

        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: res.message || 'Invalid code. Please try again.',
        });
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'An unexpected error occurred. Please try again.';

      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          Two-step verification
        </CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code sent to your email
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {/* Hidden email field */}
          <input type="hidden" {...register('email')} />

          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              {...register('code')}
            />
            {errors.code && (
              <p className="text-sm text-destructive text-center">
                {errors.code.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
