'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { recruiterProfileSchema, type RecruiterProfileFormData } from '@/lib/validations';
import type { RecruiterProfile, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export function RecruiterProfileForm() {
  const { profile, isLoading, refetch } = useProfile();
  const recruiterProfile = profile as RecruiterProfile | null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecruiterProfileFormData>({
    resolver: zodResolver(recruiterProfileSchema),
    defaultValues: {
      companyName: '',
      sector: '',
      companyDescription: '',
      companyWebsite: '',
      contactEmail: '',
      contactPhone: '',
      location: '',
    },
  });

  useEffect(() => {
    if (recruiterProfile) {
      reset({
        companyName: recruiterProfile.companyName || '',
        sector: recruiterProfile.sector || '',
        companyDescription: recruiterProfile.companyDescription || '',
        companyWebsite: recruiterProfile.companyWebsite || '',
        contactEmail: recruiterProfile.contactEmail || '',
        contactPhone: recruiterProfile.contactPhone || '',
        location: recruiterProfile.location || '',
      });
    }
  }, [recruiterProfile, reset]);

  const onSubmit = async (data: RecruiterProfileFormData) => {
    try {
      await api.put<ApiResponse>('/profiles/me', data);
      toast({ title: 'Profile updated successfully' });
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile';
      toast({
        title: 'Failed to update profile',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Update your company details to attract the best talent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...register('companyName')}
                placeholder="Your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector / Industry</Label>
              <Input
                id="sector"
                {...register('sector')}
                placeholder="e.g. Technology, Finance"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyDescription">Company Description</Label>
            <textarea
              id="companyDescription"
              {...register('companyDescription')}
              placeholder="Tell candidates about your company..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.companyDescription && (
              <p className="text-xs text-red-500">{errors.companyDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Company Website</Label>
            <Input
              id="companyWebsite"
              {...register('companyWebsite')}
              placeholder="https://yourcompany.com"
            />
            {errors.companyWebsite && (
              <p className="text-xs text-red-500">{errors.companyWebsite.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                {...register('contactEmail')}
                placeholder="contact@company.com"
              />
              {errors.contactEmail && (
                <p className="text-xs text-red-500">{errors.contactEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                {...register('contactPhone')}
                placeholder="+33 1 XX XX XX XX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-location">Location</Label>
            <Input
              id="rec-location"
              {...register('location')}
              placeholder="e.g. Paris, France"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
