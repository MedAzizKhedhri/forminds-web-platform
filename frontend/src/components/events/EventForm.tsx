'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventFormData } from '@/lib/validations';
import { Upload, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface EventFormProps {
  defaultValues?: Partial<CreateEventFormData>;
  onSubmit: (data: CreateEventFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const eventTypes = ['conference', 'workshop', 'networking', 'webinar', 'career_fair'] as const;

export default function EventForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Create',
}: EventFormProps) {
  const { t } = useLocale();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'conference',
      location: '',
      date: '',
      startTime: '',
      endTime: '',
      capacity: 50,
      isOnline: false,
      meetingUrl: '',
      image: '',
      ...defaultValues,
    },
  });

  const isOnline = watch('isOnline');
  const currentImage = watch('image');
  const typeLabels = (t('events.types', { returnObjects: true }) || {}) as Record<string, string>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.image || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data: res } = await api.post('/events/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.success && res.data?.imageUrl) {
        setValue('image', res.data.imageUrl);
      }
    } catch {
      setImagePreview(null);
      toast({
        title: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setValue('image', '');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">{t('events.eventTitle')} *</Label>
        <Input id="title" {...register('title')} placeholder="Event title" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('events.description')} *</Label>
        <Textarea id="description" {...register('description')} rows={4} placeholder="Describe the event..." />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('events.type')} *</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeLabels[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">{t('events.location')} *</Label>
          <Input id="location" {...register('location')} placeholder="City or venue" />
          {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">{t('events.date')} *</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">{t('events.startTime')} *</Label>
          <Input id="startTime" type="time" {...register('startTime')} />
          {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">{t('events.endTime')} *</Label>
          <Input id="endTime" type="time" {...register('endTime')} />
          {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">{t('events.capacity')} *</Label>
          <Input id="capacity" type="number" min={1} {...register('capacity', { valueAsNumber: true })} />
          {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('events.image')}</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          {imagePreview || currentImage ? (
            <div className="relative w-full h-32 rounded-md overflow-hidden border">
              <img
                src={imagePreview || currentImage}
                alt="Event preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input px-4 py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="h-5 w-5" />
              {isUploading ? 'Uploading...' : 'Click to upload image'}
            </button>
          )}
          {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isOnline"
          {...register('isOnline')}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isOnline" className="cursor-pointer">
          {t('events.isOnline')}
        </Label>
      </div>

      {isOnline && (
        <div className="space-y-2">
          <Label htmlFor="meetingUrl">{t('events.meetingUrl')}</Label>
          <Input id="meetingUrl" {...register('meetingUrl')} placeholder="https://meet.google.com/..." />
          {errors.meetingUrl && <p className="text-sm text-destructive">{errors.meetingUrl.message}</p>}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
        {isSubmitting ? '...' : submitLabel}
      </Button>
    </form>
  );
}
