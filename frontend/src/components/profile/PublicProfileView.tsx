'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { StudentProfile, RecruiterProfile, User, ApiResponse } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  FileText,
} from 'lucide-react';

const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/api$/, '');

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

interface PublicProfileData {
  user: User;
  profile: StudentProfile | RecruiterProfile;
}

interface PublicProfileViewProps {
  username: string;
}

export function PublicProfileView({ username }: PublicProfileViewProps) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const { data: res } = await api.get<ApiResponse<PublicProfileData>>(
          `/profiles/public/${username}`
        );
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Profile not found');
        }
      } catch {
        setError('Profile not found or is not public');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Profile Not Found</h2>
        <p className="text-muted-foreground">{error || 'This profile does not exist or is not public.'}</p>
      </div>
    );
  }

  const { user, profile } = data;
  const isStudent = user.role === 'student';
  const studentProfile = isStudent ? (profile as StudentProfile) : null;
  const recruiterProfile = !isStudent ? (profile as RecruiterProfile) : null;

  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();

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
      {/* Header Card with Cover Image */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5">
          {user.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={user.avatar || undefined} alt={user.firstName} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left flex-1 pt-14 sm:pt-16">
              <h1 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
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
                {studentProfile?.website && isSafeUrl(studentProfile.website) && (
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
                {studentProfile?.linkedinUrl && isSafeUrl(studentProfile.linkedinUrl) && (
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
                {studentProfile?.githubUrl && isSafeUrl(studentProfile.githubUrl) && (
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
                {recruiterProfile?.companyWebsite && isSafeUrl(recruiterProfile.companyWebsite) && (
                  <a
                    href={recruiterProfile.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Company Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student profile sections */}
      {isStudent && studentProfile && (
        <>
          {/* CV */}
          {studentProfile.cvUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CV / Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="rounded-lg bg-red-50 p-2">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <a
                    href={getCvFullUrl(studentProfile.cvUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    View CV (PDF)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
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

          {/* Skills */}
          {studentProfile.skills && studentProfile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
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

          {/* Education */}
          {studentProfile.education && studentProfile.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentProfile.education.map((edu, i) => (
                  <div key={edu._id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
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

          {/* Experience */}
          {studentProfile.experiences && studentProfile.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentProfile.experiences.map((exp, i) => (
                  <div key={exp._id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 mt-0.5">
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

          {/* Projects */}
          {studentProfile.projects && studentProfile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {studentProfile.projects.map((project) => (
                    <Card key={project._id} className="border shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{project.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
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

      {/* Recruiter profile sections */}
      {!isStudent && recruiterProfile && (
        <>
          {recruiterProfile.companyDescription && (
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
          )}

          {(recruiterProfile.contactEmail || recruiterProfile.contactPhone || recruiterProfile.location) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recruiterProfile.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${recruiterProfile.contactEmail}`}
                      className="text-primary hover:underline"
                    >
                      {recruiterProfile.contactEmail}
                    </a>
                  </div>
                )}
                {recruiterProfile.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {recruiterProfile.contactPhone}
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
