import config from '../config';
import AppError from '../utils/AppError';

interface StudentData {
  skills: string[];
  location?: string;
  education: Array<{ institution: string; degree: string; field: string }>;
  experiences: Array<{ title: string; company: string; description?: string }>;
}

interface OpportunityData {
  id: string;
  title: string;
  skills: string[];
  location: string;
  domain: string;
  type: string;
  requirements?: string;
}

export interface MatchResult {
  opportunityId: string;
  score: number;
  breakdown: {
    skillsScore: number;
    locationScore: number;
    domainScore: number;
  };
  explanation: string;
}

export interface DetailedMatchResult {
  overallScore: number;
  breakdown: {
    skillsScore: number;
    locationScore: number;
    domainScore: number;
    experienceScore: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

export const calculateMatches = async (
  student: StudentData,
  opportunities: OpportunityData[]
): Promise<MatchResult[]> => {
  try {
    const response = await fetch(`${config.ai.baseUrl}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student, opportunities }),
    });

    if (!response.ok) {
      throw new AppError('AI service unavailable', 503);
    }

    const data = (await response.json()) as { matches: MatchResult[] };
    return data.matches;
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Fallback to basic matching if AI service is down
    return calculateBasicMatches(student, opportunities);
  }
};

export const calculateScore = async (
  student: StudentData,
  opportunity: OpportunityData
): Promise<DetailedMatchResult> => {
  try {
    const response = await fetch(`${config.ai.baseUrl}/api/match/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student, opportunity }),
    });

    if (!response.ok) {
      throw new AppError('AI service unavailable', 503);
    }

    const data = (await response.json()) as DetailedMatchResult;
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Fallback to basic scoring if AI service is down
    return calculateBasicScore(student, opportunity);
  }
};

// Fallback matching when AI service is unavailable
const calculateBasicMatches = (
  student: StudentData,
  opportunities: OpportunityData[]
): MatchResult[] => {
  return opportunities.map((opp) => {
    const studentSkills = student.skills.map((s) => s.toLowerCase());
    const oppSkills = opp.skills.map((s) => s.toLowerCase());

    const matchedSkills = studentSkills.filter((s) => oppSkills.includes(s));
    const skillsScore = oppSkills.length > 0
      ? Math.round((matchedSkills.length / oppSkills.length) * 100)
      : 0;

    const locationScore = student.location && opp.location &&
      student.location.toLowerCase() === opp.location.toLowerCase()
      ? 100
      : 0;

    const domainScore = 50; // Default when AI is unavailable

    const score = Math.round(skillsScore * 0.5 + locationScore * 0.25 + domainScore * 0.25);

    return {
      opportunityId: opp.id,
      score,
      breakdown: { skillsScore, locationScore, domainScore },
      explanation: `Matched ${matchedSkills.length}/${oppSkills.length} required skills.`,
    };
  });
};

const calculateBasicScore = (
  student: StudentData,
  opportunity: OpportunityData
): DetailedMatchResult => {
  const studentSkills = student.skills.map((s) => s.toLowerCase());
  const oppSkills = opportunity.skills.map((s) => s.toLowerCase());

  const matchedSkills = studentSkills.filter((s) => oppSkills.includes(s));
  const missingSkills = oppSkills.filter((s) => !studentSkills.includes(s));

  const skillsScore = oppSkills.length > 0
    ? Math.round((matchedSkills.length / oppSkills.length) * 100)
    : 0;

  const locationScore = student.location && opportunity.location &&
    student.location.toLowerCase() === opportunity.location.toLowerCase()
    ? 100
    : 0;

  const domainScore = 50;
  const experienceScore = student.experiences.length > 0 ? 60 : 20;

  const overallScore = Math.round(
    skillsScore * 0.4 + locationScore * 0.2 + domainScore * 0.2 + experienceScore * 0.2
  );

  return {
    overallScore,
    breakdown: { skillsScore, locationScore, domainScore, experienceScore },
    matchedSkills,
    missingSkills,
    explanation: `Matched ${matchedSkills.length}/${oppSkills.length} required skills.${missingSkills.length > 0
        ? ` Missing: ${missingSkills.join(', ')}.`
        : ' All required skills matched.'
      }`,
  };
};
