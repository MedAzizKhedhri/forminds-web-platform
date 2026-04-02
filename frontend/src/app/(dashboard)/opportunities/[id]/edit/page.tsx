'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import type { CreateOpportunityFormData } from '@/lib/validations';

export default function EditOpportunityPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { opportunity, isLoading, getOpportunity, updateOpportunity } = useOpportunities();
  const { t } = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role guard: redirect if not recruiter
  useEffect(() => {
    if (!authLoading && user && user.role !== 'recruiter') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch opportunity data
  useEffect(() => {
    if (id) {
      getOpportunity(id);
    }
  }, [id, getOpportunity]);

  const handleSubmit = async (data: CreateOpportunityFormData) => {
    setIsSubmitting(true);
    try {
      const res = await updateOpportunity(id, data);
      if (res.success) {
        toast({
          title: t.common?.success || 'Success',
          description: t.opportunities?.edit || 'Opportunity updated.',
        });
        router.push(`/opportunities/${id}`);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t.common?.error || 'Error',
        description: 'Failed to update opportunity.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render for non-recruiters
  if (authLoading || (user && user.role !== 'recruiter')) {
    return null;
  }

  if (isLoading || !opportunity) {
    return (
      <div className="space-y-6 p-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/opportunities/${id}`)}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.common?.back || 'Back'}
      </Button>

      <h1 className="text-2xl font-bold">
        {t.opportunities?.edit || 'Edit Opportunity'}
      </h1>

      <OpportunityForm
        onSubmit={handleSubmit}
        initialData={opportunity}
        isEditing
        isLoading={isSubmitting}
      />
    </div>
  );
}
