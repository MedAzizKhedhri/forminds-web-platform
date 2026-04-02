import mongoose, { Schema, Document } from 'mongoose';
import { EventType, EventStatus } from '../utils/constants';

export interface IEvent extends Document {
  organizerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: EventType;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  isOnline: boolean;
  meetingUrl?: string;
  image?: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
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
      enum: Object.values(EventType),
      required: [true, 'Event type is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    meetingUrl: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ type: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event;
