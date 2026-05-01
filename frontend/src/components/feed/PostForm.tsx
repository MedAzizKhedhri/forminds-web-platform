'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/layout/LanguageSwitcher';

const MAX_CHARACTERS = 2000;

interface PostFormProps {
  onSubmit: (content: string) => void;
  initialContent?: string;
  isEditing?: boolean;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function PostForm({
  onSubmit,
  initialContent = '',
  isEditing = false,
  isLoading = false,
  onCancel,
}: PostFormProps) {
  const [content, setContent] = useState(initialContent);
  const { t } = useLocale();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_CHARACTERS) return;
    onSubmit(trimmed);
    if (!isEditing) {
      setContent('');
    }
  };

  const submitLabel = isEditing
    ? t('feed.update')
    : t('feed.createPost');

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('feed.placeholder')}
            rows={3}
            maxLength={MAX_CHARACTERS}
            disabled={isLoading}
            className="resize-none border-muted bg-muted/30 focus-visible:bg-background"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/{MAX_CHARACTERS}
            </span>

            <div className="flex gap-2">
              {isEditing && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || content.length > MAX_CHARACTERS || isLoading}
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
