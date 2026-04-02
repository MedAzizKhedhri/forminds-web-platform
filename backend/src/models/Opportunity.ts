import mongoose, { Schema, Document } from 'mongoose';
import { OpportunityType, OpportunityStatus } from '../utils/constants';

export interface IOpportunity extends Document {
  recruiterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: OpportunityType;
  location: string;
  domain: string;
  skills: string[];
  requirements?: string;
  deadline?: Date;
  status: OpportunityStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const opportunitySchema = new Schema<IOpportunity>(
  {
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: Object.values(OpportunityType),
      required: [true, 'Type is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
      set: (skills: string[]) => skills.map((s) => s.toLowerCase()),
    },
    requirements: {
      type: String,
      trim: true,
      maxlength: [3000, 'Requirements cannot exceed 3000 characters'],
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(OpportunityStatus),
      default: OpportunityStatus.PENDING,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
opportunitySchema.index({ recruiterId: 1 });
opportunitySchema.index({ status: 1, type: 1 });
opportunitySchema.index({ skills: 1 });
opportunitySchema.index({ domain: 1 });
opportunitySchema.index({ location: 1 });
opportunitySchema.index({ createdAt: -1 });

const Opportunity = mongoose.model<IOpportunity>('Opportunity', opportunitySchema);

export default Opportunity;
