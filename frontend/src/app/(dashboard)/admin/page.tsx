'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  GraduationCap,
  Building2,
  UserX,
  Clock,
  CheckCircle,
  FileText,
  UserPlus,
  ClipboardList,
  ShieldCheck,
  UserCog,
  ScrollText,
  Calendar,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { stats, isLoading, fetchStats } = useAdmin();

  // Role guard: redirect non-admin users
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  // Fetch stats on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user, fetchStats]);

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: t('admin.totalUsers'),
      value: stats?.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('admin.students'),
      value: stats?.totalStudents,
      icon: GraduationCap,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('admin.recruiters'),
      value: stats?.totalRecruiters,
      icon: Building2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: t('admin.suspended'),
      value: stats?.suspendedUsers,
      icon: UserX,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: t('admin.pendingOpportunities'),
      value: stats?.pendingOpportunities,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: '/admin/opportunities',
    },
    {
      label: t('admin.approvedOpportunities'),
      value: stats?.approvedOpportunities,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('admin.totalApplications'),
      value: stats?.totalApplications,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('admin.newUsers30Days'),
      value: stats?.newUsersLast30Days,
      icon: UserPlus,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: t('admin.pendingEvents'),
      value: stats?.pendingEvents,
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/admin/events',
    },
  ];

  const quickActions = [
    {
      label: t('admin.viewPendingOpportunities'),
      href: '/admin/opportunities',
      icon: ClipboardList,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: t('admin.viewPendingEvents'),
      href: '/admin/events',
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: t('admin.verifyRecruiters'),
      href: '/admin/recruiters',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: t('admin.manageUsers'),
      href: '/admin/users',
      icon: UserCog,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('admin.viewAuditLog'),
      href: '/admin/audit-log',
      icon: ScrollText,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('admin.dashboard')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {'Platform overview and management'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const cardContent = (
            <Card
              key={kpi.label}
              className={`hover:shadow-md transition-shadow ${kpi.href ? 'cursor-pointer' : ''}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <div className={`rounded-lg ${kpi.bg} p-2`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{kpi.value ?? 0}</p>
                )}
              </CardContent>
            </Card>
          );

          if (kpi.href) {
            return (
              <Link key={kpi.label} href={kpi.href}>
                {cardContent}
              </Link>
            );
          }
          return <div key={kpi.label}>{cardContent}</div>;
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t('admin.quickActions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                variant="outline"
                className="h-auto flex-col gap-3 p-6"
              >
                <Link href={action.href}>
                  <div className={`rounded-lg ${action.bg} p-3`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
