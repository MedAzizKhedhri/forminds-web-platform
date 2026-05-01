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
      <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t('settingsPage.changePassword')}</CardTitle>
              <CardDescription>
                {t('settingsPage.updatePasswordDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settingsPage.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                placeholder={t('settingsPage.currentPasswordPlaceholder')}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settingsPage.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                placeholder={t('settingsPage.newPasswordPlaceholder')}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t('settingsPage.confirmNewPassword')}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                {...register('confirmNewPassword')}
                placeholder={t('settingsPage.confirmNewPasswordPlaceholder')}
              />
              {errors.confirmNewPassword && (
                <p className="text-xs text-red-500">{errors.confirmNewPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (t('settingsPage.changing')) : (t('settingsPage.changePasswordBtn'))}
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
              <CardTitle>{t('settingsPage.twoFactor')}</CardTitle>
              <CardDescription>
                {t('settingsPage.twoFactorDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {t('settingsPage.status')}{' '}
                <span
                  className={
                    user?.is2FAEnabled ? 'text-green-600' : 'text-muted-foreground'
                  }
                >
                  {user?.is2FAEnabled ? (t('settingsPage.enabled')) : (t('settingsPage.disabled'))}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.is2FAEnabled
                  ? (t('settingsPage.twoFactorActive'))
                  : (t('settingsPage.twoFactorInactive'))}
              </p>
            </div>
            {user?.is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={twoFALoading}
              >
                {twoFALoading ? (t('settingsPage.disabling')) : t('settingsPage.disable2FA')}
              </Button>
            ) : (
              <Button onClick={handleEnable2FA} disabled={twoFALoading}>
                {twoFALoading ? (t('settingsPage.enabling')) : t('settingsPage.enable2FA')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Confirmation Dialog */}
      <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('settingsPage.confirm2FA')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {t('settingsPage.enter6digit')}
            </p>
            <Input
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('settingsPage.enterCodePlaceholder')}
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
                {t('settingsPage.cancel')}
              </Button>
              <Button
                onClick={handleConfirm2FA}
                disabled={twoFACode.length !== 6 || confirmingTwoFA}
              >
                {confirmingTwoFA ? (t('settingsPage.confirming')) : (t('settingsPage.confirm'))}
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
              <CardTitle className="text-red-600">{t('settingsPage.deleteAccount')}</CardTitle>
              <CardDescription>
                {t('settingsPage.deleteAccountDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t('settingsPage.deleteWarning')}
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
              {t('settingsPage.deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settingsPage.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settingsPage.cannotUndo')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">
                {t('settingsPage.enterPasswordConfirm')}
              </Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError('');
                }}
                placeholder={t('settingsPage.enterPasswordPlaceholder')}
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
              {t('settingsPage.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || !deletePassword}
            >
              {deleteLoading ? (t('settingsPage.deleting')) : (t('settingsPage.deleteMyAccount'))}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
