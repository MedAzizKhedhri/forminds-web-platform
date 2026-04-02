import mongoose from 'mongoose';
import Application, { IApplication } from '../models/Application';
import Opportunity from '../models/Opportunity';
import User from '../models/User';
import AppError from '../utils/AppError';
import { ApplicationStatus, OpportunityStatus } from '../utils/constants';

export const apply = async (
  studentId: string,
  opportunityId: string,
  coverLetter?: string
): Promise<IApplication> => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (opportunity.status !== OpportunityStatus.APPROVED) {
    throw new AppError('This opportunity is not currently accepting applications', 400);
  }

  if (opportunity.deadline && new Date() > opportunity.deadline) {
    throw new AppError('The deadline for this opportunity has passed', 400);
  }

  const existing = await Application.findOne({ studentId, opportunityId });
  if (existing) {
    throw new AppError('You have already applied to this opportunity', 409);
  }

  const application = await Application.create({
    studentId,
    opportunityId,
    coverLetter,
    status: ApplicationStatus.PENDING,
    appliedAt: new Date(),
  });

  return application;
};

export const getStudentApplications = async (
  studentId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ applications: IApplication[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = { studentId };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'opportunityId',
        select: 'title type location domain recruiterId',
        populate: {
          path: 'recruiterId',
          select: 'firstName lastName username avatar',
        },
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  return { applications, total };
};

export const getOpportunityApplications = async (
  opportunityId: string,
  recruiterId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ applications: IApplication[]; total: number }> => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (opportunity.recruiterId.toString() !== recruiterId) {
    throw new AppError('You can only view applications for your own opportunities', 403);
  }

  const skip = (page - 1) * limit;
  const filter = { opportunityId };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('studentId', 'firstName lastName username avatar email')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  return { applications, total };
};

export const getRecruiterApplications = async (
  recruiterId: string,
  filters: { status?: string; search?: string; opportunityId?: string } = {},
  page: number = 1,
  limit: number = 20
): Promise<{ applications: IApplication[]; total: number; statusCounts: Record<string, number> }> => {
  // Find all opportunity IDs belonging to this recruiter
  const recruiterOpportunities = await Opportunity.find({ recruiterId }, { _id: 1 });
  const opportunityIds = recruiterOpportunities.map((o) => o._id);

  if (opportunityIds.length === 0) {
    return {
      applications: [],
      total: 0,
      statusCounts: { pending: 0, reviewed: 0, shortlisted: 0, accepted: 0, rejected: 0 },
    };
  }

  // If filtering by a specific opportunity, verify ownership
  let scopeIds = opportunityIds;
  if (filters.opportunityId) {
    const owned = opportunityIds.some((id) => id.toString() === filters.opportunityId);
    if (!owned) {
      throw new AppError('You can only view applications for your own opportunities', 403);
    }
    scopeIds = [new mongoose.Types.ObjectId(filters.opportunityId)];
  }

  // Build query filter
  const queryFilter: Record<string, unknown> = {
    opportunityId: { $in: scopeIds },
  };

  if (filters.status && filters.status !== 'all') {
    queryFilter.status = filters.status;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    const matchingUsers = await User.find(
      {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      },
      { _id: 1 }
    );
    queryFilter.studentId = { $in: matchingUsers.map((u) => u._id) };
  }

  const skip = (page - 1) * limit;

  // Aggregate status counts (unaffected by status/search filters)
  const aggMatchFilter = {
    opportunityId: { $in: scopeIds.map((id) => new mongoose.Types.ObjectId(id.toString())) },
  };

  const [applications, total, statusCountsAgg] = await Promise.all([
    Application.find(queryFilter)
      .populate('studentId', 'firstName lastName username avatar email')
      .populate('opportunityId', 'title type location domain')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(queryFilter),
    Application.aggregate([
      { $match: aggMatchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts: Record<string, number> = {
    pending: 0, reviewed: 0, shortlisted: 0, accepted: 0, rejected: 0,
  };
  for (const item of statusCountsAgg) {
    statusCounts[item._id] = item.count;
  }

  return { applications, total, statusCounts };
};

export const updateApplicationStatus = async (
  applicationId: string,
  recruiterId: string,
  status: string
): Promise<IApplication> => {
  const validStatuses: string[] = [
    ApplicationStatus.REVIEWED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid application status: ${status}`, 400);
  }

  const application = await Application.findById(applicationId).populate('opportunityId');
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunity = application.opportunityId as any;
  if (!opportunity || opportunity.recruiterId.toString() !== recruiterId) {
    throw new AppError('You can only update applications for your own opportunities', 403);
  }

  application.status = status as ApplicationStatus;
  await application.save();

  return application;
};

export const getApplication = async (
  applicationId: string
): Promise<IApplication> => {
  const application = await Application.findById(applicationId)
    .populate('studentId', 'firstName lastName username avatar email')
    .populate({
      path: 'opportunityId',
      select: 'title type location domain recruiterId status',
      populate: {
        path: 'recruiterId',
        select: 'firstName lastName username avatar',
      },
    });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  return application;
};
