import mongoose, { Schema, Document } from 'mongoose';
import { TokenType } from '../utils/constants';

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: TokenType;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TokenType),
      required: [true, 'Token type is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: MongoDB automatically deletes documents once expiresAt is reached
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookups
tokenSchema.index({ userId: 1, type: 1 });

const Token = mongoose.model<IToken>('Token', tokenSchema);

export default Token;
