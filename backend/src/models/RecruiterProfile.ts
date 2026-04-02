import mongoose, { Schema, Document } from 'mongoose';

export interface IRecruiterProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  sector: string;
  companyDescription?: string;
  companyWebsite?: string;
  companyLogo?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recruiterProfileSchema = new Schema<IRecruiterProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
      default: '',
    },
    sector: {
      type: String,
      trim: true,
      default: '',
    },
    companyDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Company description cannot exceed 2000 characters'],
    },
    companyWebsite: {
      type: String,
      trim: true,
    },
    companyLogo: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// userId index is already created by `unique: true` on the field definition

const RecruiterProfile = mongoose.model<IRecruiterProfile>('RecruiterProfile', recruiterProfileSchema);

export default RecruiterProfile;
