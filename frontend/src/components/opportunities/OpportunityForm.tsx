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
            ? t('opportunities.edit')
            : t('opportunities.create')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => onSubmit(data as CreateOpportunityFormData))} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t('opportunities.title')}
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder={t('opportunities.title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('opportunities.description')}
            </Label>
            <Textarea
              id="description"
              rows={5}
              {...register('description')}
              placeholder={t('opportunities.description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>{t('opportunities.type')}</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('opportunities.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage">
                      {t('opportunities.stage')}
                    </SelectItem>
                    <SelectItem value="emploi">
                      {t('opportunities.emploi')}
                    </SelectItem>
                    <SelectItem value="benevolat">
                      {t('opportunities.benevolat')}
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
              {t('opportunities.location')}
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder={t('opportunities.location')}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain">
              {t('opportunities.domain')}
            </Label>
            <Input
              id="domain"
              {...register('domain')}
              placeholder={t('opportunities.domain')}
            />
            {errors.domain && (
              <p className="text-sm text-destructive">{errors.domain.message}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>{t('opportunities.skills')}</Label>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <SkillTags
                  skills={field.value || []}
                  onChange={field.onChange}
                  placeholder={t('opportunities.skills')}
                />
              )}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">
              {t('opportunities.requirements')}
            </Label>
            <Textarea
              id="requirements"
              rows={3}
              {...register('requirements')}
              placeholder={t('opportunities.requirements')}
            />
            {errors.requirements && (
              <p className="text-sm text-destructive">{errors.requirements.message}</p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">
              {t('opportunities.deadline')}
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
              ? t('common.loading')
              : isEditing
                ? t('common.save')
                : t('opportunities.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
