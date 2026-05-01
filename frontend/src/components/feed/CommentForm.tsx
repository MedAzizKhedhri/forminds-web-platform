'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/layout/LanguageSwitcher';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function CommentForm({ onSubmit, isLoading }: CommentFormProps) {
  const [content, setContent] = useState('');
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await onSubmit(trimmed);
      setContent('');
    } catch {
      // Keep content on failure so user doesn't lose their input
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('feed.writeComment')}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        disabled={!content.trim() || isLoading}
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">{t('feed.send')}</span>
      </Button>
    </form>
  );
}
