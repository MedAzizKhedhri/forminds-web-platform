'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, MapPin, ArrowRight, RefreshCw } from 'lucide-react';
import { useMatching } from '@/hooks/useMatching';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/types';

function ScoreBar({ score, className }: { score: number; className?: string }) {
  const color =
    score >= 80 ? 'bg-green-500' :
      score >= 60 ? 'bg-blue-500' :
        score >= 40 ? 'bg-yellow-500' :
          'bg-red-500';

  return (
    <div className={`w-full bg-secondary rounded-full h-2.5 ${className || ''}`}>
      <div
        className={`h-2.5 rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

export default function RecommendationsPage() {
  const { recommendations, total, isLoading, getRecommendations } = useMatching();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const mt = t.matching || {};
  const oppTypes: Record<string, string> = {
    stage: t.opportunities?.stage || 'Internship',
    emploi: t.opportunities?.emploi || 'Employment',
    benevolat: t.opportunities?.benevolat || 'Volunteering',
  };

  useEffect(() => {
    if (!isAuthLoading && user && user.role !== 'student') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user && user.role === 'student') {
      getRecommendations();
    }
  }, [user, getRecommendations]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">{mt.title || 'Recommendations'}</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-10">
            {mt.subtitle || 'Opportunities matched to your profile by AI'}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => getRecommendations()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {mt.refresh || 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground max-w-md mx-auto">
            {mt.noRecommendations || 'No recommendations available. Complete your profile to get personalized suggestions.'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/profile')}>
            {mt.completeProfile || 'Complete Your Profile'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const opportunity = rec.opportunity;
            const recruiter = typeof opportunity.recruiterId === 'object' ? (opportunity.recruiterId as User) : null;
            const scorePercent = Math.round(rec.score);

            return (
              <Card key={opportunity._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
                          <circle
                            cx="40" cy="40" r="35"
                            fill="none"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(scorePercent / 100) * 220} 220`}
                            className={
                              scorePercent >= 80 ? 'stroke-green-500' :
                                scorePercent >= 60 ? 'stroke-blue-500' :
                                  scorePercent >= 40 ? 'stroke-yellow-500' :
                                    'stroke-red-500'
                            }
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{scorePercent}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">{mt.score || 'Match'}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                          {recruiter && (
                            <p className="text-sm text-muted-foreground">
                              {recruiter.firstName} {recruiter.lastName}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {oppTypes[opportunity.type] || opportunity.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {opportunity.location}
                        </span>
                        <span>{opportunity.domain}</span>
                      </div>

                      {/* Score Breakdown Bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{mt.skills || 'Skills'}</span>
                            <span className="font-medium">{Math.round(rec.breakdown.skillsScore)}%</span>
                          </div>
                          <ScoreBar score={rec.breakdown.skillsScore} />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{mt.location || 'Location'}</span>
                            <span className="font-medium">{Math.round(rec.breakdown.locationScore)}%</span>
                          </div>
                          <ScoreBar score={rec.breakdown.locationScore} />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{mt.domain || 'Domain'}</span>
                            <span className="font-medium">{Math.round(rec.breakdown.domainScore)}%</span>
                          </div>
                          <ScoreBar score={rec.breakdown.domainScore} />
                        </div>
                      </div>

                      {rec.explanation && (
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{rec.explanation}&rdquo;
                        </p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => router.push(`/recommendations/${opportunity._id}`)}
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          {mt.viewDetail || 'View Detail'}
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => router.push(`/opportunities/${opportunity._id}`)}
                        >
                          {mt.apply || 'Apply'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
