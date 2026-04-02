import Opportunity, { IOpportunity } from '../models/Opportunity';
import Application from '../models/Application';
import AppError from '../utils/AppError';
import { OpportunityStatus } from '../utils/constants';

interface OpportunityFilters {
  type?: string;
  location?: string;
  domain?: string;
  skills?: string[];
}

export const createOpportunity = async (
  recruiterId: string,
  data: Partial<IOpportunity>
): Promise<IOpportunity> => {
  const opportunity = await Opportunity.create({
    ...data,
    recruiterId,
    status: OpportunityStatus.PENDING,
  });

  return opportunity;
};

export const updateOpportunity = async (
  opportunityId: string,
  recruiterId: string,
  data: Partial<IOpportunity>
): Promise<IOpportunity> => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (opportunity.recruiterId.toString() !== recruiterId) {
    throw new AppError('You can only modify your own opportunities', 403);
  }

  if (opportunity.status === OpportunityStatus.CLOSED) {
    throw new AppError('Cannot modify a closed opportunity', 400);
  }

  if (opportunity.status === OpportunityStatus.REJECTED) {
    throw new AppError('Cannot modify a rejected opportunity', 400);
  }

  Object.assign(opportunity, data);
  await opportunity.save();

  return opportunity;
};

export const closeOpportunity = async (
  opportunityId: string,
  recruiterId: string
): Promise<IOpportunity> => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (opportunity.recruiterId.toString() !== recruiterId) {
    throw new AppError('You can only close your own opportunities', 403);
  }

  if (opportunity.status !== OpportunityStatus.APPROVED) {
    throw new AppError('Only approved opportunities can be closed', 400);
  }

  opportunity.status = OpportunityStatus.CLOSED;
  await opportunity.save();

  return opportunity;
};

export const reopenOpportunity = async (
  opportunityId: string,
  recruiterId: string
): Promise<IOpportunity> => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (opportunity.recruiterId.toString() !== recruiterId) {
    throw new AppError('You can only reopen your own opportunities', 403);
  }

  if (opportunity.status !== OpportunityStatus.CLOSED) {
    throw new AppError('Only closed opportunities can be reopened', 400);
  }

  opportunity.status = OpportunityStatus.PENDING;
  await opportunity.save();

  return opportunity;
};

export const deleteOpportunity = async (
  opportunityId: string,
  recruiterId: string
): Promise<void> => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (opportunity.recruiterId.toString() !== recruiterId) {
    throw new AppError('You can only delete your own opportunities', 403);
  }

  // Delete all applications for this opportunity
  await Application.deleteMany({ opportunityId });

  // Delete the opportunity
  await Opportunity.findByIdAndDelete(opportunityId);
};

export const getOpportunity = async (
  opportunityId: string
): Promise<IOpportunity> => {
  const opportunity = await Opportunity.findById(opportunityId).populate(
    'recruiterId',
    'firstName lastName username avatar companyName'
  );

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  return opportunity;
};

export const searchOpportunities = async (
  filters: OpportunityFilters,
  page: number = 1,
  limit: number = 20
): Promise<{ opportunities: IOpportunity[]; total: number }> => {
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { status: OpportunityStatus.APPROVED };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.location) {
    query.location = { $regex: filters.location, $options: 'i' };
  }

  if (filters.domain) {
    query.domain = { $regex: filters.domain, $options: 'i' };
  }

  if (filters.skills && filters.skills.length > 0) {
    const lowerSkills = filters.skills.map((s) => s.toLowerCase());
    query.skills = { $in: lowerSkills };
  }

  const [opportunities, total] = await Promise.all([
    Opportunity.find(query)
      .populate('recruiterId', 'firstName lastName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Opportunity.countDocuments(query),
  ]);

  return { opportunities, total };
};

export const getRecruiterOpportunities = async (
  recruiterId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ opportunities: IOpportunity[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = { recruiterId };

  const [opportunities, total] = await Promise.all([
    Opportunity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Opportunity.countDocuments(filter),
  ]);

  return { opportunities, total };
};
