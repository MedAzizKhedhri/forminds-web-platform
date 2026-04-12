"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import {
  studentProfileSchema,
  type StudentProfileFormData,
} from "@/lib/validations";
import type { StudentProfile, ApiResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillTags } from "@/components/profile/SkillTags";
import { EducationSection } from "@/components/profile/EducationSection";
import { ExperienceSection } from "@/components/profile/ExperienceSection";
import { ProjectCard } from "@/components/profile/ProjectCard";

export function StudentProfileForm() {
  const { profile, isLoading, refetch } = useProfile();
  const studentProfile = profile as StudentProfile | null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      headline: "",
      bio: "",
      phone: "",
      location: "",
      website: "",
      linkedinUrl: "",
      githubUrl: "",
      skills: [],
      isPublic: false,
    },
  });

  const skills = watch("skills") || [];
  const isPublic = watch("isPublic");

  useEffect(() => {
    if (studentProfile) {
      reset({
        headline: studentProfile.headline || "",
        bio: studentProfile.bio || "",
        phone: studentProfile.phone || "",
        location: studentProfile.location || "",
        website: studentProfile.website || "",
        linkedinUrl: studentProfile.linkedinUrl || "",
        githubUrl: studentProfile.githubUrl || "",
        skills: studentProfile.skills || [],
        isPublic: studentProfile.isPublic ?? false,
      });
    }
  }, [studentProfile, reset]);

  const onSubmitGeneral = async (data: StudentProfileFormData) => {
    try {
      await api.put<ApiResponse>("/profiles/me", data);
      toast({ title: "Profile updated successfully" });
      await refetch();
    } catch {
      toast({
        title: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleSkillsChange = (newSkills: string[]) => {
    setValue("skills", newSkills, { shouldDirty: true });
  };

  const saveSkills = async () => {
    try {
      await api.put<ApiResponse>("/profiles/me", { skills });
      toast({ title: "Skills updated successfully" });
      await refetch();
    } catch {
      toast({
        title: "Failed to update skills",
        variant: "destructive",
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
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="education">Education</TabsTrigger>
        <TabsTrigger value="experience">Experience</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
      </TabsList>

      {/* Tab 1: General Info */}
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmitGeneral)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  {...register("headline")}
                  placeholder="e.g. Full Stack Developer | Student"
                  maxLength={120}
                />
                {errors.headline && (
                  <p className="text-xs text-red-500">
                    {errors.headline.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  {...register("bio")}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {errors.bio && (
                  <p className="text-xs text-red-500">{errors.bio.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="e.g. Paris, France"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+33 6 XX XX XX XX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://yourwebsite.com"
                />
                {errors.website && (
                  <p className="text-xs text-red-500">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    {...register("linkedinUrl")}
                    placeholder="https://linkedin.com/in/..."
                  />
                  {errors.linkedinUrl && (
                    <p className="text-xs text-red-500">
                      {errors.linkedinUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    {...register("githubUrl")}
                    placeholder="https://github.com/..."
                  />
                  {errors.githubUrl && (
                    <p className="text-xs text-red-500">
                      {errors.githubUrl.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setValue("isPublic", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPublic" className="text-sm font-normal">
                  Make my profile public
                </Label>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 2: Skills */}
      <TabsContent value="skills">
        <Card>
          <CardHeader>
            <CardTitle>Your Skills ({skills.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Manual Skills Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add Skill Manually</Label>
              <SkillTags
                skills={skills}
                onChange={handleSkillsChange}
                maxSkills={50}
                placeholder="Type a skill and press Enter (e.g. React, Python)"
              />
            </div>

            {/* Skills by Source */}
            {studentProfile && (
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Your skills are automatically gathered from your education,
                  experience, and projects.
                </p>

                {/* From Education */}
                {studentProfile.education &&
                  studentProfile.education.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">📚</span> From Education (
                        {studentProfile.education.reduce(
                          (sum, edu) => sum + (edu.skills?.length || 0),
                          0,
                        )}
                        )
                      </h4>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {studentProfile.education.map((edu) =>
                          edu.skills?.map((skill) => (
                            <span
                              key={`edu-${skill}`}
                              className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                            >
                              {skill}
                            </span>
                          )),
                        )}
                      </div>
                    </div>
                  )}

                {/* From Experience */}
                {studentProfile.experiences &&
                  studentProfile.experiences.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">💼</span> From Experience (
                        {studentProfile.experiences.reduce(
                          (sum, exp) => sum + (exp.skills?.length || 0),
                          0,
                        )}
                        )
                      </h4>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {studentProfile.experiences.map((exp) =>
                          exp.skills?.map((skill) => (
                            <span
                              key={`exp-${skill}`}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {skill}
                            </span>
                          )),
                        )}
                      </div>
                    </div>
                  )}

                {/* From Projects */}
                {studentProfile.projects &&
                  studentProfile.projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">📁</span> From Projects (
                        {studentProfile.projects.reduce(
                          (sum, proj) => sum + (proj.technologies?.length || 0),
                          0,
                        )}
                        )
                      </h4>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {studentProfile.projects.map((proj) =>
                          proj.technologies?.map((tech) => (
                            <span
                              key={`proj-${tech}`}
                              className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                            >
                              {tech}
                            </span>
                          )),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={saveSkills}>Save Skills</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 3: Education */}
      <TabsContent value="education">
        <Card>
          <CardContent className="pt-6">
            <EducationSection
              education={studentProfile?.education || []}
              onUpdate={refetch}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 4: Experience */}
      <TabsContent value="experience">
        <Card>
          <CardContent className="pt-6">
            <ExperienceSection
              experiences={studentProfile?.experiences || []}
              onUpdate={refetch}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 5: Projects */}
      <TabsContent value="projects">
        <Card>
          <CardContent className="pt-6">
            <ProjectCard
              projects={studentProfile?.projects || []}
              onUpdate={refetch}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
