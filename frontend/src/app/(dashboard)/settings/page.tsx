'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Key, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a digit')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { t } = useLocale();
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [confirmingTwoFA, setConfirmingTwoFA] = useState(false);

  const router = useRouter();

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    try {
      await api.post<ApiResponse>('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({ title: 'Password changed successfully' });
      reset();
    } catch {
      toast({
        title: 'Failed to change password',
        description: 'Please check your current password and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEnable2FA = async () => {
    setTwoFALoading(true);
    try {
      const { data: res } = await api.post<ApiResponse<{ qrCodeUrl: string }>>(
        '/auth/enable-2fa'
      );
      if (res.success && res.data?.qrCodeUrl) {
        setQrCode(res.data.qrCodeUrl);
        setTwoFADialogOpen(true);
      } else {
        // If no QR code is returned, 2FA may have been enabled via email OTP
        toast({ title: '2FA setup initiated. Check your email for further instructions.' });
        setTwoFADialogOpen(true);
      }
    } catch {
      toast({
        title: 'Failed to enable 2FA',
        variant: 'destructive',
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (twoFACode.length !== 6) return;

    setConfirmingTwoFA(true);
    try {
      await api.post<ApiResponse>('/auth/confirm-2fa', { code: twoFACode });
      toast({ title: '2FA enabled successfully' });
      setTwoFADialogOpen(false);
      setTwoFACode('');
      setQrCode(null);
      refreshUser();
    } catch {
      toast({
        title: 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConfirmingTwoFA(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFALoading(true);
    try {
      await api.post<ApiResponse>('/auth/disable-2fa');
      toast({ title: '2FA disabled successfully' });
      refreshUser();
    } catch {
      toast({
        title: 'Failed to disable 2FA',
        variant: 'destructive',
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await api.delete<ApiResponse>('/profiles/me/account', {
        data: { password: deletePassword },
      });

      toast({ title: 'Account deleted successfully' });

      await logout();
      router.push('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t.nav?.settings || 'Settings'}</h1>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                placeholder="Enter your current password"
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                placeholder="Enter a new password"
              />
              {errors.newPassword && (
                <p className="text-xs text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                {...register('confirmNewPassword')}
                placeholder="Confirm your new password"
              />
              {errors.confirmNewPassword && (
                <p className="text-xs text-red-500">{errors.confirmNewPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Status:{' '}
                <span
                  className={
                    user?.is2FAEnabled ? 'text-green-600' : 'text-muted-foreground'
                  }
                >
                  {user?.is2FAEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.is2FAEnabled
                  ? 'Two-factor authentication is active on your account.'
                  : 'Enable 2FA to add an extra layer of security.'}
              </p>
            </div>
            {user?.is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={twoFALoading}
              >
                {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            ) : (
              <Button onClick={handleEnable2FA} disabled={twoFALoading}>
                {twoFALoading ? 'Enabling...' : 'Enable 2FA'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Confirmation Dialog */}
      <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Enter the 6-digit verification code to confirm setup.
            </p>
            <Input
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTwoFADialogOpen(false);
                  setTwoFACode('');
                  setQrCode(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm2FA}
                disabled={twoFACode.length !== 6 || confirmingTwoFA}
              >
                {confirmingTwoFA ? 'Confirming...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Separator />

      {/* Danger Zone - Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. All your data
              including your profile, posts, connections, and applications will be
              permanently removed.
            </p>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={() => {
                setDeleteDialogOpen(true);
                setDeletePassword('');
                setDeleteError('');
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers, including your
              profile, posts, connections, opportunities, and applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">
                Enter your password to confirm
              </Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError('');
                }}
                placeholder="Enter your password"
              />
              {deleteError && (
                <p className="text-xs text-red-500">{deleteError}</p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletePassword('');
                setDeleteError('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || !deletePassword}
            >
              {deleteLoading ? 'Deleting...' : 'Delete my account'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
