'use client';

import { useState, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { projectSchema, type ProjectFormData } from '@/lib/validations';
import type { Project, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ExternalLink, X } from 'lucide-react';

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

interface ProjectCardProps {
  projects: Project[];
  onUpdate: () => void;
}

export function ProjectCard({ projects, onUpdate }: ProjectCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const openAdd = () => {
    setEditing(null);
    setTechnologies([]);
    setTechInput('');
    reset({
      title: '',
      description: '',
      technologies: [],
      link: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setTechnologies(project.technologies || []);
    setTechInput('');
    reset({
      title: project.title,
      description: project.description,
      technologies: project.technologies || [],
      link: project.link || '',
    });
    setDialogOpen(true);
  };

  const addTech = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed || technologies.includes(trimmed)) return;
    setTechnologies((prev) => [...prev, trimmed]);
    setTechInput('');
  };

  const removeTech = (index: number) => {
    setTechnologies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTechKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTech(techInput);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const payload = {
        ...data,
        technologies,
      };

      if (editing) {
        await api.put<ApiResponse>(
          `/profiles/me/projects/${editing._id}`,
          payload
        );
        toast({ title: 'Project updated successfully' });
      } else {
        await api.post<ApiResponse>('/profiles/me/projects', payload);
        toast({ title: 'Project added successfully' });
      }

      setDialogOpen(false);
      reset();
      setTechnologies([]);
      onUpdate();
    } catch {
      toast({
        title: 'Failed to save project',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await api.delete<ApiResponse>(`/profiles/me/projects/${deletingId}`);
      toast({ title: 'Project deleted' });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onUpdate();
    } catch {
      toast({
        title: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projects</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Project' : 'Add Project'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proj-title">Title</Label>
                <Input
                  id="proj-title"
                  {...register('title')}
                  placeholder="Project name"
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proj-description">Description</Label>
                <textarea
                  id="proj-description"
                  {...register('description')}
                  placeholder="Describe your project..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Technologies</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {technologies.map((tech, i) => (
                    <Badge key={`${tech}-${i}`} variant="secondary" className="gap-1 pr-1">
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTech(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleTechKeyDown}
                  placeholder="Type technology and press Enter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proj-link">Link (optional)</Label>
                <Input
                  id="proj-link"
                  {...register('link')}
                  placeholder="https://github.com/..."
                />
                {errors.link && (
                  <p className="text-xs text-red-500">{errors.link.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No projects yet. Click &quot;Add&quot; to showcase your work.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Card key={project._id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{project.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDelete(project._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech, i) => (
                    <Badge key={`${tech}-${i}`} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
              {project.link && isSafeUrl(project.link) && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Project
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
