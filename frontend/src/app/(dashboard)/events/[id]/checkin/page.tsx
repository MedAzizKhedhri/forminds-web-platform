'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, CheckCircle2, XCircle, AlertTriangle, Users, Camera, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as UserType } from '@/types';

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { event, participants = [], total, isLoading, getEvent, checkin, getEventParticipants } = useEvents();
  const { user } = useAuth();
  const { t } = useLocale();

  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    user?: { firstName: string; lastName: string; avatar?: string };
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);
  // Only recruiters can access check-in page
  useEffect(() => {
    if (user && user.role !== 'recruiter') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (id && user?.role === 'recruiter') {
      getEvent(id);
      getEventParticipants(id);
    }
  }, [id, user, getEvent, getEventParticipants]);

  const handleCheckin = useCallback(async (qrCode: string) => {
    if (!id || !qrCode.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await checkin(id, qrCode.trim());
      if (res?.success) {
        const reg = res.data?.registration;
        const regUser = reg && typeof reg.userId === 'object' ? (reg.userId as UserType) : null;
        setScanResult({
          type: 'success',
          message: t('events.checkinSuccess'),
          user: regUser ? { firstName: regUser.firstName, lastName: regUser.lastName, avatar: regUser.avatar } : undefined,
        });
        setQrInput('');
        getEventParticipants(id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = error?.response?.data?.message || 'Error';
      const status = error?.response?.status;
      if (msg?.includes('Already checked in') || status === 409) {
        setScanResult({ type: 'warning', message: t('events.alreadyCheckedIn') });
      } else {
        setScanResult({ type: 'error', message: msg || t('events.invalidQR') });
      }
    } finally {
      setScanning(false);
    }
  }, [id, checkin, t, getEventParticipants]);

  const startCamera = useCallback(async () => {
    if (!scannerContainerRef.current || isTransitioningRef.current) return;

    setCameraError(null);
    isTransitioningRef.current = true;
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleCheckin(decodedText);
        },
        () => {
          // QR code not found - ignore
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Failed to access camera. Please check permissions.'
      );
      setCameraActive(false);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [handleCheckin]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      try {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.error('Error stopping camera:', err);
      } finally {
        isTransitioningRef.current = false;
      }
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanMode, startCamera, stopCamera]);

  const checkedInCount = participants.filter((p) => p.checkedIn).length;

  if (isLoading && !event) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-3">
        <QrCode className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('events.checkin')}</h1>
          {event && <p className="text-muted-foreground">{event.title}</p>}
        </div>
      </div>

      {/* QR Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('events.scanQR')}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('camera')}
                className="gap-1"
              >
                <Camera className="h-4 w-4" />
                {t('events.camera')}
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('manual')}
                className="gap-1"
              >
                <Keyboard className="h-4 w-4" />
                {t('events.manual')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanMode === 'camera' ? (
            <div className="space-y-4">
              <div
                id="qr-reader"
                ref={scannerContainerRef}
                className="w-full max-w-md mx-auto rounded-lg overflow-hidden bg-black/5"
                style={{ minHeight: '300px' }}
              />
              {cameraError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-800">{cameraError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setScanMode('manual')}
                  >
                    {t('events.switchToManual')}
                  </Button>
                </div>
              )}
              {cameraActive && !cameraError && (
                <p className="text-sm text-center text-muted-foreground">
                  {t('events.pointCamera')}
                </p>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Input
                placeholder="Enter or scan QR code..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckin(qrInput)}
                autoFocus
              />
              <Button onClick={() => handleCheckin(qrInput)} disabled={scanning || !qrInput.trim()}>
                {t('events.checkin')}
              </Button>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${scanResult.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : scanResult.type === 'warning'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-red-50 border border-red-200'
              }`}>
              {scanResult.type === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />}
              {scanResult.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />}
              {scanResult.type === 'error' && <XCircle className="h-6 w-6 text-red-600 shrink-0" />}
              <div>
                <p className={`font-medium ${scanResult.type === 'success' ? 'text-green-800'
                  : scanResult.type === 'warning' ? 'text-yellow-800'
                    : 'text-red-800'
                  }`}>
                  {scanResult.message}
                </p>
                {scanResult.user && (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={scanResult.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {scanResult.user.firstName[0]}{scanResult.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{scanResult.user.firstName} {scanResult.user.lastName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('events.participants')} ({total})
            </CardTitle>
            <Badge variant="secondary">{checkedInCount} / {total} {t('events.checkedIn')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No participants yet</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => {
                const pUser = typeof p.userId === 'object' ? (p.userId as UserType) : null;
                if (!pUser) return null;
                return (
                  <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={pUser.avatar} />
                        <AvatarFallback className="text-xs">
                          {pUser.firstName[0]}{pUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{pUser.firstName} {pUser.lastName}</p>
                        <p className="text-xs text-muted-foreground">{pUser.email}</p>
                      </div>
                    </div>
                    {p.checkedIn ? (
                      <Badge className="bg-green-100 text-green-800 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('events.checkedIn') || 'Checked In'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t('events.notCheckedIn') || 'Not Checked In'}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
