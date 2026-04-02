import StudentProfile from '../models/StudentProfile';
import Opportunity from '../models/Opportunity';
import AppError from '../utils/AppError';
import { OpportunityStatus } from '../utils/constants';
import * as aiService from './ai.service';
import { DetailedMatchResult } from './ai.service';

export const getRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<{
  recommendations: Array<{
    opportunity: typeof Opportunity.prototype;
    score: number;
    breakdown: { skillsScore: number; locationScore: number; domainScore: number };
    explanation: string;
  }>;
  total: number;
}> => {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile || profile.skills.length === 0) {
    throw new AppError('Please complete your profile to get recommendations', 400);
  }

  // Get approved, active opportunities
  const opportunities = await Opportunity.find({
    status: OpportunityStatus.APPROVED,
    $or: [
      { deadline: { $gte: new Date() } },
      { deadline: null },
      { deadline: { $exists: false } },
    ],
  }).populate('recruiterId', 'firstName lastName username avatar');

  if (opportunities.length === 0) {
    return { recommendations: [], total: 0 };
  }

  const studentData = {
    skills: profile.skills,
    location: profile.location,
    education: profile.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
    })),
    experiences: profile.experiences.map((e) => ({
      title: e.position,
      company: e.company,
      description: e.description,
    })),
  };

  const opportunityData = opportunities.map((opp) => ({
    id: opp._id.toString(),
    title: opp.title,
    skills: opp.skills,
    location: opp.location,
    domain: opp.domain,
    type: opp.type,
    requirements: opp.requirements,
  }));

  const matches = await aiService.calculateMatches(studentData, opportunityData);

  // Sort by score descending and limit
  const sortedMatches = matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Map back to opportunity documents
  const oppMap = new Map(opportunities.map((o) => [o._id.toString(), o]));

  const recommendations = sortedMatches
    .map((match) => {
      const opp = oppMap.get(match.opportunityId);
      if (!opp) return null;
      return {
        opportunity: opp,
        score: match.score,
        breakdown: match.breakdown,
        explanation: match.explanation,
      };
    })
    .filter(Boolean) as Array<{
      opportunity: typeof Opportunity.prototype;
      score: number;
      breakdown: { skillsScore: number; locationScore: number; domainScore: number };
      explanation: string;
    }>;

  return { recommendations, total: recommendations.length };
};

export const getMatchScore = async (
  userId: string,
  opportunityId: string
): Promise<{
  opportunity: typeof Opportunity.prototype;
  matching: DetailedMatchResult;
}> => {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile || profile.skills.length === 0) {
    throw new AppError('Please complete your profile to get match details', 400);
  }

  const opportunity = await Opportunity.findById(opportunityId)
    .populate('recruiterId', 'firstName lastName username avatar');

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  const studentData = {
    skills: profile.skills,
    location: profile.location,
    education: profile.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
    })),
    experiences: profile.experiences.map((e) => ({
      title: e.position,
      company: e.company,
      description: e.description,
    })),
  };

  const opportunityData = {
    id: opportunity._id.toString(),
    title: opportunity.title,
    skills: opportunity.skills,
    location: opportunity.location,
    domain: opportunity.domain,
    type: opportunity.type,
    requirements: opportunity.requirements,
  };

  const matching = await aiService.calculateScore(studentData, opportunityData);

  return { opportunity, matching };
};
