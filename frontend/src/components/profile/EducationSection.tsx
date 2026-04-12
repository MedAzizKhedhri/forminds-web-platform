"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { educationSchema, type EducationFormData } from "@/lib/validations";
import type { Education, ApiResponse } from "@/types";
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
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { SkillTags } from "./SkillTags";

interface EducationSectionProps {
  education: Education[];
  onUpdate: () => void;
}

export function EducationSection({
  education,
  onUpdate,
}: EducationSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: "",
      degree: "",
      field: "",
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
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      current: false,
      skills: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (edu: Education) => {
    setEditing(edu);
    reset({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate ? edu.startDate.substring(0, 10) : "",
      endDate: edu.endDate ? edu.endDate.substring(0, 10) : "",
      current: edu.current,
      skills: edu.skills || [],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: EducationFormData) => {
    try {
      const payload = { ...data };
      if (payload.current) {
        payload.endDate = undefined;
      }

      if (editing) {
        await api.put<ApiResponse>(
          `/profiles/me/education/${editing._id}`,
          payload,
        );
        toast({ title: "Education updated successfully" });
      } else {
        await api.post<ApiResponse>("/profiles/me/education", payload);
        toast({ title: "Education added successfully" });
      }

      setDialogOpen(false);
      reset();
      onUpdate();
    } catch {
      toast({
        title: "Failed to save education",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete<ApiResponse>(`/profiles/me/education/${id}`);
      toast({ title: "Education deleted" });
      onUpdate();
    } catch {
      toast({
        title: "Failed to delete education",
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
        <h3 className="text-lg font-semibold">Education</h3>
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
                {editing ? "Edit Education" : "Add Education"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  {...register("institution")}
                  placeholder="University name"
                />
                {errors.institution && (
                  <p className="text-xs text-red-500">
                    {errors.institution.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  {...register("degree")}
                  placeholder="e.g. Bachelor's, Master's"
                />
                {errors.degree && (
                  <p className="text-xs text-red-500">
                    {errors.degree.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="field">Field of Study</Label>
                <Input
                  id="field"
                  {...register("field")}
                  placeholder="e.g. Computer Science"
                />
                {errors.field && (
                  <p className="text-xs text-red-500">{errors.field.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
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
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
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
                  placeholder="Add skills gained (e.g., Python, Data Analysis)"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="current"
                  checked={currentValue}
                  onChange={(e) => setValue("current", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="current" className="text-sm font-normal">
                  Currently studying here
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

      {education.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No education entries yet. Click &quot;Add&quot; to get started.
        </p>
      )}

      <div className="space-y-3">
        {education.map((edu) => (
          <Card key={edu._id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {edu.degree} in {edu.field}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {edu.institution}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(edu)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(edu._id)}
                    disabled={deleting === edu._id}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-xs text-muted-foreground">
                {formatDate(edu.startDate)} -{" "}
                {edu.current ? "Present" : formatDate(edu.endDate)}
              </p>
              {edu.skills && edu.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {edu.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
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
