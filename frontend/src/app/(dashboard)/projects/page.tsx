'use client';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { ProjectCard } from '@/components/profile/ProjectCard';
import type { StudentProfile } from '@/types';

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading, refetch } = useProfile();
  const { t } = useLocale();

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== 'student') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t.common?.notAvailable || 'This page is not available for your role.'}
        </p>
      </div>
    );
  }

  const studentProfile = profile as StudentProfile | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.profile?.projects || 'My Projects'}
        </h1>
        <p className="text-muted-foreground">
          {t.profile?.projectsDescription || 'Manage and showcase your projects.'}
        </p>
      </div>

      <ProjectCard
        projects={studentProfile?.projects || []}
        onUpdate={refetch}
      />
    </div>
  );
}
