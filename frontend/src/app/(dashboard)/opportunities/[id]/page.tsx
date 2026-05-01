'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();

  const { opportunity, isLoading, getOpportunity, closeOpportunity, reopenOpportunity, deleteOpportunity } = useOpportunities();
  const { apply, isLoading: isApplying } = useApplications();

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (id) {
      getOpportunity(id);
    }
  }, [id, getOpportunity]);

  const handleApply = async () => {
    try {
      const res = await apply(id, coverLetter || undefined);
      if (res.success) {
        setHasApplied(true);
        setApplyDialogOpen(false);
        setCoverLetter('');
        toast({
          title: t('common.success'),
          description: t('opportunities.apply'),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to submit application.',
      });
    }
  };

  const handleEdit = () => {
    router.push(`/opportunities/${id}/edit`);
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to close this opportunity?')) {
      return;
    }

    try {
      const res = await closeOpportunity(id);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: t('opportunities.close'),
        });
        getOpportunity(id);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to close opportunity.',
      });
    }
  };

  const handleReopen = async () => {
    if (!window.confirm('Are you sure you want to reopen this opportunity?')) {
      return;
    }

    try {
      const res = await reopenOpportunity(id);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: 'Opportunity reopened successfully.',
        });
        getOpportunity(id);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to reopen opportunity.',
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this opportunity? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await deleteOpportunity(id);
      if (res.success) {
        toast({
          title: t('common.success'),
          description: 'Opportunity deleted successfully.',
        });
        router.push('/opportunities/mine');
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to delete opportunity.',
      });
    }
  };

  if (isLoading || !opportunity) {
    return (
      <div className="space-y-6 p-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(user?.role === 'recruiter' ? '/opportunities/mine' : '/opportunities')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      {/* Detail view */}
      <OpportunityDetail
        opportunity={opportunity}
        userRole={user?.role}
        userId={user?._id}
        onApply={() => setApplyDialogOpen(true)}
        hasApplied={hasApplied}
        onEdit={handleEdit}
        onClose={handleClose}
        onReopen={handleReopen}
        onDelete={handleDelete}
      />

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('opportunities.apply')}
            </DialogTitle>
            <DialogDescription>
              {opportunity.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="coverLetter">
              {t('opportunities.coverLetter')}
            </Label>
            <Textarea
              id="coverLetter"
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={
                t('opportunities.coverLetterPlaceholder')
              }
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying
                ? t('common.loading')
                : t('opportunities.apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
