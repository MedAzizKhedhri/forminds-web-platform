'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillTags } from '@/components/profile/SkillTags';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { createOpportunitySchema, type CreateOpportunityFormData } from '@/lib/validations';
import type { Opportunity } from '@/types';

type FormInput = {
  title: string;
  description: string;
  type: 'stage' | 'emploi' | 'benevolat';
  location: string;
  domain: string;
  skills?: string[];
  requirements?: string;
  deadline?: string;
};

interface OpportunityFormProps {
  onSubmit: (data: CreateOpportunityFormData) => void;
  initialData?: Partial<Opportunity>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function OpportunityForm({
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}: OpportunityFormProps) {
  const { t } = useLocale();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      type: initialData?.type || 'stage',
      location: initialData?.location || '',
      domain: initialData?.domain || '',
      skills: initialData?.skills || [],
      requirements: initialData?.requirements || '',
      deadline: initialData?.deadline
        ? initialData.deadline.substring(0, 10)
        : '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing
            ? t.opportunities?.edit || 'Edit Opportunity'
            : t.opportunities?.create || 'Create Opportunity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => onSubmit(data as CreateOpportunityFormData))} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t.opportunities?.title || 'Title'}
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder={t.opportunities?.title || 'Title'}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t.opportunities?.description || 'Description'}
            </Label>
            <Textarea
              id="description"
              rows={5}
              {...register('description')}
              placeholder={t.opportunities?.description || 'Description'}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>{t.opportunities?.type || 'Type'}</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.opportunities?.type || 'Type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage">
                      {t.opportunities?.stage || 'Internship'}
                    </SelectItem>
                    <SelectItem value="emploi">
                      {t.opportunities?.emploi || 'Employment'}
                    </SelectItem>
                    <SelectItem value="benevolat">
                      {t.opportunities?.benevolat || 'Volunteering'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              {t.opportunities?.location || 'Location'}
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder={t.opportunities?.location || 'Location'}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain">
              {t.opportunities?.domain || 'Domain'}
            </Label>
            <Input
              id="domain"
              {...register('domain')}
              placeholder={t.opportunities?.domain || 'Domain'}
            />
            {errors.domain && (
              <p className="text-sm text-destructive">{errors.domain.message}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>{t.opportunities?.skills || 'Required skills'}</Label>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <SkillTags
                  skills={field.value || []}
                  onChange={field.onChange}
                  placeholder={t.opportunities?.skills || 'Type a skill and press Enter'}
                />
              )}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">
              {t.opportunities?.requirements || 'Requirements'}
            </Label>
            <Textarea
              id="requirements"
              rows={3}
              {...register('requirements')}
              placeholder={t.opportunities?.requirements || 'Requirements'}
            />
            {errors.requirements && (
              <p className="text-sm text-destructive">{errors.requirements.message}</p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">
              {t.opportunities?.deadline || 'Deadline'}
            </Label>
            <Input
              id="deadline"
              type="date"
              {...register('deadline')}
            />
            {errors.deadline && (
              <p className="text-sm text-destructive">{errors.deadline.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading
              ? t.common?.loading || 'Loading...'
              : isEditing
                ? t.common?.save || 'Update'
                : t.opportunities?.create || 'Create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
