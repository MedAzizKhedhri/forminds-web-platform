'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { StudentProfileForm } from '@/components/profile/StudentProfileForm';
import { RecruiterProfileForm } from '@/components/profile/RecruiterProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProfileEditPage() {
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {t.profile?.editProfile || 'Edit Profile'}
        </h1>
      </div>

      {user?.role === 'student' && <StudentProfileForm />}
      {user?.role === 'recruiter' && <RecruiterProfileForm />}
      {user?.role === 'admin' && (
        <div className="text-center py-12 text-muted-foreground">
          Admin profiles are managed through the admin panel.
        </div>
      )}
    </div>
  );
}
