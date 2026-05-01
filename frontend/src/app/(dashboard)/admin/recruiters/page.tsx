'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import type { User } from '@/types';

export default function AdminRecruitersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const {
    unverifiedRecruiters,
    pagination,
    isLoading,
    fetchUnverifiedRecruiters,
    verifyRecruiter,
  } = useAdmin();

  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  // Fetch unverified recruiters
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUnverifiedRecruiters(1, 20);
    }
  }, [user, fetchUnverifiedRecruiters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUnverifiedRecruiters(page, 20);
  };

  const handleVerify = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await verifyRecruiter(userId);
      if (res.success) {
        toast({ title: 'Organisation verified successfully' });
      }
    } catch {
      toast({
        title: 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRecruiterUserId = (recruiter: typeof unverifiedRecruiters[0]): string => {
    if (typeof recruiter.userId === 'string') return recruiter.userId;
    return (recruiter.userId as User)._id;
  };

  const getRecruiterName = (recruiter: typeof unverifiedRecruiters[0]): string => {
    if (typeof recruiter.userId === 'object' && recruiter.userId !== null) {
      const u = recruiter.userId as User;
      return `${u.firstName} ${u.lastName}`;
    }
    return 'Unknown User';
  };

  const getRecruiterRegisteredDate = (recruiter: typeof unverifiedRecruiters[0]): string => {
    if (typeof recruiter.userId === 'object' && recruiter.userId !== null) {
      return new Date((recruiter.userId as User).createdAt).toLocaleDateString();
    }
    return new Date(recruiter.createdAt).toLocaleDateString();
  };

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.recruitersVerification')}
        </h1>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && unverifiedRecruiters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {t('admin.noUnverifiedRecruiters')}
          </p>
          <p className="text-sm mt-1">
            {'All organisations have been verified'}
          </p>
        </div>
      )}

      {/* Recruiter cards */}
      {!isLoading && unverifiedRecruiters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unverifiedRecruiters.map((recruiter) => {
            const userId = getRecruiterUserId(recruiter);
            return (
              <Card key={recruiter._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {getRecruiterName(recruiter)}
                    </CardTitle>
                    <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                      {'Unverified'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-foreground">
                        {recruiter.companyName}
                      </span>
                    </div>

                    {recruiter.sector && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {recruiter.sector}
                        </Badge>
                      </div>
                    )}

                    {recruiter.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{recruiter.location}</span>
                      </div>
                    )}

                    {recruiter.contactEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{recruiter.contactEmail}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {t('admin.registeredOn')}:{' '}
                        {getRecruiterRegisteredDate(recruiter)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => handleVerify(userId)}
                    disabled={actionLoading === userId}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {actionLoading === userId
                      ? ('Verifying...')
                      : (t('admin.verify'))}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {'Page'} {currentPage} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
          >
            {'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
