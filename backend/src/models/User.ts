import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, AuthProvider } from '../utils/constants';
import config from '../config';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  authProvider: AuthProvider;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  isActive: boolean;
  avatar?: string;
  coverImage?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_-]{3,30}$/, 'Username must be 3-30 characters and contain only lowercase letters, numbers, hyphens, and underscores'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    is2FAEnabled: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.__v;
        if (ret.avatar && typeof ret.avatar === 'string' && ret.avatar.startsWith('/')) {
          ret.avatar = `${config.serverUrl}${ret.avatar}`;
        }
        if (ret.coverImage && typeof ret.coverImage === 'string' && ret.coverImage.startsWith('/')) {
          ret.coverImage = `${config.serverUrl}${ret.coverImage}`;
        }
        return ret;
      },
    },
  }
);

// Indexes
// email and username indexes are already created by `unique: true` on their field definitions
userSchema.index({ role: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
