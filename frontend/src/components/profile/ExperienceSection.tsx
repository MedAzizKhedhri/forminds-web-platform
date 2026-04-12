"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { experienceSchema, type ExperienceFormData } from "@/lib/validations";
import type { Experience, ApiResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { SkillTags } from "./SkillTags";

interface ExperienceSectionProps {
  experiences: Experience[];
  onUpdate: () => void;
}

export function ExperienceSection({
  experiences,
  onUpdate,
}: ExperienceSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: "",
      position: "",
      description: "",
      startDate: "",
      endDate: "",
      current: false,
      skills: [],
    },
  });

  const currentValue = watch("current");

  const openAdd = () => {
    setEditing(null);
    reset({
      company: "",
      position: "",
      description: "",
      startDate: "",
      endDate: "",
      current: false,
      skills: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (exp: Experience) => {
    setEditing(exp);
    reset({
      company: exp.company,
      position: exp.position,
      description: exp.description || "",
      startDate: exp.startDate ? exp.startDate.substring(0, 10) : "",
      endDate: exp.endDate ? exp.endDate.substring(0, 10) : "",
      current: exp.current,
      skills: exp.skills || [],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const payload = { ...data };
      if (payload.current) {
        payload.endDate = undefined;
      }

      if (editing) {
        await api.put<ApiResponse>(
          `/profiles/me/experiences/${editing._id}`,
          payload,
        );
        toast({ title: "Experience updated successfully" });
      } else {
        await api.post<ApiResponse>("/profiles/me/experiences", payload);
        toast({ title: "Experience added successfully" });
      }

      setDialogOpen(false);
      reset();
      onUpdate();
    } catch {
      toast({
        title: "Failed to save experience",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete<ApiResponse>(`/profiles/me/experiences/${id}`);
      toast({ title: "Experience deleted" });
      onUpdate();
    } catch {
      toast({
        title: "Failed to delete experience",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Experience</h3>
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
                {editing ? "Edit Experience" : "Add Experience"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  {...register("company")}
                  placeholder="Company name"
                />
                {errors.company && (
                  <p className="text-xs text-red-500">
                    {errors.company.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  {...register("position")}
                  placeholder="e.g. Software Engineer"
                />
                {errors.position && (
                  <p className="text-xs text-red-500">
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe your role and responsibilities..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp-startDate">Start Date</Label>
                  <Input
                    id="exp-startDate"
                    type="date"
                    {...register("startDate")}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-red-500">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-endDate">End Date</Label>
                  <Input
                    id="exp-endDate"
                    type="date"
                    {...register("endDate")}
                    disabled={currentValue}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills Gained</Label>
                <SkillTags
                  skills={watch("skills") || []}
                  onChange={(skills) => setValue("skills", skills)}
                  maxSkills={20}
                  placeholder="Add skills gained (e.g., TypeScript, React, Leadership)"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exp-current"
                  checked={currentValue}
                  onChange={(e) => setValue("current", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="exp-current" className="text-sm font-normal">
                  I currently work here
                </Label>
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
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {experiences.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No experience entries yet. Click &quot;Add&quot; to get started.
        </p>
      )}

      <div className="space-y-3">
        {experiences.map((exp) => (
          <Card key={exp._id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 mt-0.5">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{exp.position}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {exp.company}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(exp)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(exp._id)}
                    disabled={deleting === exp._id}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {exp.description && (
                <p className="text-sm text-muted-foreground mb-1">
                  {exp.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDate(exp.startDate)} -{" "}
                {exp.current ? "Present" : formatDate(exp.endDate)}
              </p>
              {exp.skills && exp.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {exp.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
