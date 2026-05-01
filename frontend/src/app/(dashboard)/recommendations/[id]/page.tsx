'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, TrendingUp, MapPin, ArrowRight,
  CheckCircle2, XCircle, Briefcase,
} from 'lucide-react';
import { useMatching } from '@/hooks/useMatching';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/types';

function ProgressBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color =
    score >= 80 ? 'bg-green-500' :
      score >= 60 ? 'bg-blue-500' :
        score >= 40 ? 'bg-yellow-500' :
          'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-bold">{Math.round(score)}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { matchDetail, isLoading, getMatchScore } = useMatching();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLocale();
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== 'student') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (id && user && user.role === 'student') {
      getMatchScore(id);
    }
  }, [id, user, getMatchScore]);

  if (isLoading || !matchDetail) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { opportunity, matching } = matchDetail;
  const recruiter = typeof opportunity.recruiterId === 'object' ? (opportunity.recruiterId as User) : null;
  const scorePercent = Math.round(matching.overallScore);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push('/recommendations')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t('matching.backToList') || 'Back to Recommendations'}
      </Button>

      {/* Opportunity Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{opportunity.title}</h1>
              {recruiter && (
                <p className="text-muted-foreground">{recruiter.firstName} {recruiter.lastName}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {opportunity.location}
                </span>
                <span>{opportunity.domain}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {opportunity.type}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <h2 className="text-base font-medium text-muted-foreground mb-4">{t('matching.overallScore') || 'Overall Match Score'}</h2>
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="62" fill="none" stroke="currentColor" strokeWidth="10" className="text-secondary" />
                <circle
                  cx="72" cy="72" r="62"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(scorePercent / 100) * 390} 390`}
                  className={
                    scorePercent >= 80 ? 'stroke-green-500' :
                      scorePercent >= 60 ? 'stroke-blue-500' :
                        scorePercent >= 40 ? 'stroke-yellow-500' :
                          'stroke-red-500'
                  }
                  style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{scorePercent}%</span>
                <Sparkles className="h-4 w-4 text-primary mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('matching.breakdown') || 'Score Breakdown'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProgressBar
            label={t('matching.skills') || 'Skills Match'}
            score={matching.breakdown.skillsScore}
            icon={<Sparkles className="h-4 w-4 text-purple-500" />}
          />
          <ProgressBar
            label={t('matching.location') || 'Location Match'}
            score={matching.breakdown.locationScore}
            icon={<MapPin className="h-4 w-4 text-blue-500" />}
          />
          <ProgressBar
            label={t('matching.domain') || 'Domain Match'}
            score={matching.breakdown.domainScore}
            icon={<Briefcase className="h-4 w-4 text-orange-500" />}
          />
          {matching.breakdown.experienceScore !== undefined && (
            <ProgressBar
              label={t('matching.experience') || 'Experience Match'}
              score={matching.breakdown.experienceScore}
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matching.matchedSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                {t('matching.matchedSkills') || 'Matched Skills'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matching.matchedSkills.map((skill) => (
                  <Badge key={skill} className="bg-green-100 text-green-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {matching.missingSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                {t('matching.missingSkills') || 'Missing Skills'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matching.missingSkills.map((skill) => (
                  <Badge key={skill} variant="destructive" className="bg-red-100 text-red-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Explanation */}
      {matching.explanation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('matching.explanation') || 'AI Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{matching.explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* Action */}
      <div className="flex justify-center">
        <Button
          size="lg"
          className="gap-2"
          onClick={() => router.push(`/opportunities/${opportunity._id}`)}
        >
          {t('matching.apply') || 'Apply'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
