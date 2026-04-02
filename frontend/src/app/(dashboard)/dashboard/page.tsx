'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { StudentProfile, Post, Application } from '@/types';
import {
  Pencil,
  Eye,
  Settings,
  FolderOpen,
  Users,
  MessageSquare,
  Briefcase,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const { t } = useLocale();

  const [pendingCount, setPendingCount] = useState(0);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);

  const studentProfile = user?.role === 'student' ? (profile as StudentProfile) : null;
  const completionPercent = studentProfile?.profileCompletionPercent ?? 0;

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : '??';

  useEffect(() => {
    async function fetchWidgets() {
      setWidgetsLoading(true);
      try {
        const requests: Promise<unknown>[] = [];

        // Fetch pending connections count
        requests.push(
          api.get('/connections/pending', { params: { page: 1, limit: 1 } })
            .then((res) => {
              if (res.data?.success && res.data?.data) {
                setPendingCount(res.data.data.total || res.data.data.data?.length || 0);
              }
            })
            .catch(() => { })
        );

        // Fetch recent posts
        requests.push(
          api.get('/posts', { params: { page: 1, limit: 3 } })
            .then((res) => {
              if (res.data?.success && res.data?.data) {
                setRecentPosts(res.data.data.data || []);
              }
            })
            .catch(() => { })
        );

        // Fetch recent applications (student)
        if (user?.role === 'student') {
          requests.push(
            api.get('/applications/mine', { params: { page: 1, limit: 3 } })
              .then((res) => {
                if (res.data?.success && res.data?.data) {
                  setRecentApplications(res.data.data.data || []);
                }
              })
              .catch(() => { })
          );
        }

        await Promise.all(requests);
      } finally {
        setWidgetsLoading(false);
      }
    }

    if (user) {
      fetchWidgets();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 sm:p-8 text-white">
        <div className="absolute top-4 -right-8 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-white/20 shadow-lg">
            <AvatarImage src={user?.avatar || undefined} alt={user?.firstName || 'User'} />
            <AvatarFallback className="text-lg bg-white/10 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t.dashboard?.welcome || 'Welcome'}, {user?.firstName}!
            </h1>
            <p className="mt-1 text-white/70 text-sm sm:text-base">
              {t.dashboard?.completeProfile || 'Complete your profile to increase your visibility'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button asChild variant="secondary" className="bg-white/15 text-white border-0 hover:bg-white/25 backdrop-blur-sm">
              <Link href="/profile">
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Profile completion bar (students only) */}
      {user?.role === 'student' && (
        <Card className="animate-fadeIn">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {t.profile?.profileCompletion || 'Profile completion'}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {completionPercent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sprint 2 Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pending Connections Widget */}
        <Card className="hover:shadow-md animate-slideUp stagger-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-2.5">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {t.dashboard?.pendingConnections || 'Pending requests'}
                </CardTitle>
              </div>
              {!widgetsLoading && pendingCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="mb-4">
              {widgetsLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : pendingCount > 0 ? (
                `${pendingCount} pending connection request${pendingCount > 1 ? 's' : ''}`
              ) : (
                'No pending requests'
              )}
            </CardDescription>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/network">
                {t.nav?.network || 'Network'}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Posts Widget */}
        <Card className="hover:shadow-md animate-slideUp stagger-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold">
                {t.dashboard?.recentPosts || 'Recent posts'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="mb-4">
              {widgetsLoading ? (
                <Skeleton className="h-4 w-40" />
              ) : recentPosts.length > 0 ? (
                <div className="space-y-2">
                  {recentPosts.slice(0, 2).map((post) => (
                    <p key={post._id} className="text-xs text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground">
                        {post.authorId?.firstName} {post.authorId?.lastName}
                      </span>
                      {' '}{post.content.slice(0, 60)}{post.content.length > 60 ? '...' : ''}
                    </p>
                  ))}
                </div>
              ) : (
                'No posts yet'
              )}
            </CardDescription>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/feed">
                {t.nav?.feed || 'Feed'}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Opportunities Widget */}
        <Card className="hover:shadow-md animate-slideUp stagger-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">
                {t.nav?.opportunities || 'Opportunities'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="mb-4">
              {user?.role === 'recruiter'
                ? 'Manage your opportunities and review applications'
                : 'Discover internships, jobs, and volunteering'}
            </CardDescription>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href={user?.role === 'recruiter' ? '/opportunities/mine' : '/opportunities'}>
                {t.nav?.opportunities || 'Opportunities'}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Student: Recent Applications Widget */}
        {user?.role === 'student' && (
          <Card className="hover:shadow-md animate-slideUp stagger-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-2.5">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {t.dashboard?.recentApplications || 'Recent applications'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-4">
                {widgetsLoading ? (
                  <Skeleton className="h-4 w-36" />
                ) : recentApplications.length > 0 ? (
                  <div className="space-y-1.5">
                    {recentApplications.map((app) => {
                      const opp = typeof app.opportunityId === 'object' ? app.opportunityId : null;
                      return (
                        <p key={app._id} className="text-xs text-muted-foreground line-clamp-1">
                          <span className="font-medium text-foreground">
                            {opp?.title || 'Application'}
                          </span>
                          {' — '}
                          <span className={
                            app.status === 'accepted' ? 'text-green-600 font-medium' :
                              app.status === 'rejected' ? 'text-red-600 font-medium' :
                                'text-yellow-600 font-medium'
                          }>
                            {t.applications?.status?.[app.status] || app.status}
                          </span>
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  'No applications yet'
                )}
              </CardDescription>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/applications">
                  {t.nav?.applications || 'My Applications'}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick action cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/profile/edit" className="group">
            <Card className="hover:shadow-md hover:border-primary/20 transition-all h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
                  <Pencil className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.profile?.editProfile || 'Edit Profile'}</p>
                  <p className="text-xs text-muted-foreground truncate">Update your info</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href={user?.username ? `/p/${user.username}` : '/profile'} className="group">
            <Card className="hover:shadow-md hover:border-primary/20 transition-all h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 group-hover:bg-blue-100 transition-colors">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.profile?.publicProfile || 'Public Profile'}</p>
                  <p className="text-xs text-muted-foreground truncate">See how others view you</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings" className="group">
            <Card className="hover:shadow-md hover:border-primary/20 transition-all h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-muted p-2.5 group-hover:bg-muted/80 transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.nav?.settings || 'Settings'}</p>
                  <p className="text-xs text-muted-foreground truncate">Password & security</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          {user?.role === 'student' && (
            <Link href="/projects" className="group">
              <Card className="hover:shadow-md hover:border-primary/20 transition-all h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2.5 group-hover:bg-emerald-100 transition-colors">
                    <FolderOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.profile?.projects || 'My Projects'}</p>
                    <p className="text-xs text-muted-foreground truncate">Showcase your work</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
