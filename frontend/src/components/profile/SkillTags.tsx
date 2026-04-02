'use client';

import { useState, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface SkillTagsProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  placeholder?: string;
}

export function SkillTags({
  skills,
  onChange,
  maxSkills = 20,
  placeholder = 'Type a skill and press Enter',
}: SkillTagsProps) {
  const [inputValue, setInputValue] = useState('');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    if (skills.length >= maxSkills) return;

    onChange([...skills, trimmed]);
    setInputValue('');
  };

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge
            key={`${skill}-${index}`}
            variant="secondary"
            className="gap-1 pl-3 pr-1 py-1 text-sm"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {skills.length < maxSkills && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      )}

      {skills.length >= maxSkills && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxSkills} skills reached.
        </p>
      )}
    </div>
  );
}
