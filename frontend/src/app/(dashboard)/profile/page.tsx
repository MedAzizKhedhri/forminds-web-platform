'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { toast } from '@/hooks/use-toast';
import type { StudentProfile, RecruiterProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  MapPin,
  Globe,
  Linkedin,
  Github,
  Mail,
  Phone,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Pencil,
  Building2,
  Camera,
  Loader2,
  FileText,
  Upload,
  Trash2,
  ImageIcon,
} from 'lucide-react';

const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/api$/, '');

export default function ProfilePage() {
  const { user } = useAuth();
  const {
    profile, isLoading, error,
    uploadAvatar, deleteAvatar,
    uploadCover, deleteCover,
    uploadCV, deleteCV,
  } = useProfile();
  const { t } = useLocale();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isDeletingCover, setIsDeletingCover] = useState(false);
  const [isDeletingCV, setIsDeletingCV] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isRecruiter = user?.role === 'recruiter';
  const studentProfile = isStudent ? (profile as StudentProfile) : null;
  const recruiterProfile = isRecruiter ? (profile as RecruiterProfile) : null;

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '??';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
    if (file.size > MAX_SIZE) {
      toast({
        title: t('common.error'),
        description: 'La taille maximale autorisée est de 5 Mo.',
        variant: 'destructive',
      });
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast({ title: t('common.success'), description: 'Avatar updated.' });
    } catch {
      toast({ title: t('common.error'), description: 'Failed to upload avatar.', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatar) return;
    setIsDeletingAvatar(true);
    try {
      await deleteAvatar();
      toast({ title: t('common.success'), description: 'Avatar removed.' });
    } catch {
      toast({ title: t('common.error'), description: 'Failed to remove avatar.', variant: 'destructive' });
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
    if (file.size > MAX_SIZE) {
      toast({
        title: t('common.error'),
        description: 'La taille maximale autorisée est de 5 Mo.',
        variant: 'destructive',
      });
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    setIsUploadingCover(true);
    try {
      await uploadCover(file);
      toast({ title: t('common.success'), description: 'Cover image updated.' });
    } catch {
      toast({ title: t('common.error'), description: 'Failed to upload cover image.', variant: 'destructive' });
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDeleteCover = async () => {
    if (!user?.coverImage) return;
    setIsDeletingCover(true);
    try {
      await deleteCover();
      toast({ title: t('common.success'), description: 'Cover image removed.' });
    } catch {
      toast({ title: t('common.error'), description: 'Failed to remove cover image.', variant: 'destructive' });
    } finally {
      setIsDeletingCover(false);
    }
  };

  const handleCVChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
    if (file.size > MAX_SIZE) {
      toast({
        title: t('common.error'),
        description: 'La taille maximale autorisée est de 10 Mo.',
        variant: 'destructive',
      });
      if (cvInputRef.current) cvInputRef.current.value = '';
      return;
    }

    setIsUploadingCV(true);
    try {
      await uploadCV(file);
      toast({ title: t('common.success'), description: 'CV uploaded.' });
    } catch {
      toast({ title: t('common.error'), description: 'Failed to upload CV.', variant: 'destructive' });
    } finally {
      setIsUploadingCV(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  const handleDeleteCV = async () => {
    if (!studentProfile?.cvUrl) return;
    setIsDeletingCV(true);
    try {
      await deleteCV();
      toast({ title: t('common.success'), description: 'CV removed.' });
    } catch {
      toast({ title: t('common.error'), description: 'Failed to remove CV.', variant: 'destructive' });
    } finally {
      setIsDeletingCV(false);
    }
  };

  const getCvFullUrl = (cvUrl: string) => {
    if (cvUrl.startsWith('http')) return cvUrl;
    return `${SERVER_URL}${cvUrl}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('profile.myProfile')}</h1>
        {!isAdmin && (
          <Button asChild>
            <Link href="/profile/edit">
              <Pencil className="mr-2 h-4 w-4" />
              {t('profile.editProfile')}
            </Link>
          </Button>
        )}
      </div>

      {/* Header Card with Cover Image */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-r from-primary/30 via-primary/15 to-violet-500/10">
          {user?.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="flex items-center gap-1.5 rounded-md bg-black/50 px-3 py-1.5 text-xs text-white hover:bg-black/70 transition-colors cursor-pointer"
            >
              {isUploadingCover ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              {user?.coverImage ? 'Change' : 'Add cover'}
            </button>
            {user?.coverImage && (
              <button
                type="button"
                onClick={handleDeleteCover}
                disabled={isDeletingCover}
                className="flex items-center gap-1.5 rounded-md bg-red-600/80 px-3 py-1.5 text-xs text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                {isDeletingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                <AvatarImage src={user?.avatar || undefined} alt={user?.firstName || 'User'} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={isDeletingAvatar}
                  className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-destructive p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-destructive/90"
                >
                  {isDeletingAvatar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="text-center sm:text-left flex-1 pt-16 sm:pt-18">
              <h2 className="text-2xl font-bold tracking-tight">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
              {studentProfile?.headline && (
                <p className="text-lg text-muted-foreground mt-1">
                  {studentProfile.headline}
                </p>
              )}
              {recruiterProfile?.companyName && (
                <p className="text-lg text-muted-foreground mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {recruiterProfile.companyName}
                  {recruiterProfile.sector && ` - ${recruiterProfile.sector}`}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
                {(studentProfile?.location || recruiterProfile?.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {studentProfile?.location || recruiterProfile?.location}
                  </span>
                )}
                {studentProfile?.website && (
                  <a
                    href={studentProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {studentProfile?.linkedinUrl && (
                  <a
                    href={studentProfile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {studentProfile?.githubUrl && (
                  <a
                    href={studentProfile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student sections */}
      {isStudent && studentProfile && (
        <>
          {/* CV Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CV / Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentProfile.cvUrl ? (
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-50 p-2">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <a
                        href={getCvFullUrl(studentProfile.cvUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        View CV (PDF)
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF - Max 10 Mo
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cvInputRef.current?.click()}
                      disabled={isUploadingCV}
                    >
                      {isUploadingCV ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      Replace
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteCV}
                      disabled={isDeletingCV}
                    >
                      {isDeletingCV ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No CV uploaded yet</p>
                  <p className="text-xs text-muted-foreground mb-4">PDF only, max 10 Mo</p>
                  <Button
                    variant="outline"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={isUploadingCV}
                  >
                    {isUploadingCV ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload CV
                  </Button>
                </div>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCVChange}
              />
            </CardContent>
          </Card>

          {studentProfile.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {studentProfile.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {studentProfile.skills && studentProfile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.skills')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {studentProfile.skills.map((skill, i) => (
                    <Badge key={`${skill}-${i}`} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {studentProfile.education && studentProfile.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.education')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentProfile.education.map((edu, i) => (
                  <div key={edu._id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 mt-0.5">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {edu.degree} in {edu.field}
                        </h4>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(edu.startDate)} -{' '}
                          {edu.current ? 'Present' : formatDate(edu.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {studentProfile.experiences && studentProfile.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.experience')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentProfile.experiences.map((exp, i) => (
                  <div key={exp._id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-blue-50 p-2 mt-0.5">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{exp.position}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {exp.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(exp.startDate)} -{' '}
                          {exp.current ? 'Present' : formatDate(exp.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {studentProfile.projects && studentProfile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.projects')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {studentProfile.projects.map((project) => (
                    <Card key={project._id} className="border shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{project.title}</CardTitle>
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
                        {project.link && (
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
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Admin section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Administrator Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are logged in as an administrator. Use the admin dashboard to manage users, opportunities, and platform settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recruiter sections */}
      {isRecruiter && recruiterProfile && (
        <>
          {recruiterProfile.companyDescription ? (
            <Card>
              <CardHeader>
                <CardTitle>About the Company</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {recruiterProfile.companyDescription}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {recruiterProfile.sector && (
            <Card>
              <CardHeader>
                <CardTitle>Industry</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{recruiterProfile.sector}</Badge>
              </CardContent>
            </Card>
          )}

          {(recruiterProfile.contactEmail || recruiterProfile.contactPhone || recruiterProfile.companyWebsite || recruiterProfile.location) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recruiterProfile.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {recruiterProfile.contactEmail}
                  </div>
                )}
                {recruiterProfile.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {recruiterProfile.contactPhone}
                  </div>
                )}
                {recruiterProfile.companyWebsite && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={recruiterProfile.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {recruiterProfile.companyWebsite}
                    </a>
                  </div>
                )}
                {recruiterProfile.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {recruiterProfile.location}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
