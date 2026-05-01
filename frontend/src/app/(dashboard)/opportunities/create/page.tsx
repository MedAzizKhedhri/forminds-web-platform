'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import type { CreateOpportunityFormData } from '@/lib/validations';

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { createOpportunity } = useOpportunities();
  const { t } = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role guard: redirect if not recruiter
  useEffect(() => {
    if (!authLoading && user && user.role !== 'recruiter') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (data: CreateOpportunityFormData) => {
    setIsSubmitting(true);
    try {
      const res = await createOpportunity(data);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('opportunities.create'),
        });
        router.push('/opportunities/mine');
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to create opportunity.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render for non-recruiters
  if (authLoading || (user && user.role !== 'recruiter')) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/opportunities')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <h1 className="text-2xl font-bold">
        {t('opportunities.create')}
      </h1>

      <OpportunityForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
