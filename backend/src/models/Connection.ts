import mongoose, { Schema, Document } from 'mongoose';
import { ConnectionStatus } from '../utils/constants';

export interface IConnection extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    status: {
      type: String,
      enum: Object.values(ConnectionStatus),
      default: ConnectionStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
connectionSchema.index({ receiverId: 1, status: 1 });
connectionSchema.index({ senderId: 1, status: 1 });

const Connection = mongoose.model<IConnection>('Connection', connectionSchema);

// Drop stale indexes from a previous schema version (requesterId, addresseeId)
(async () => {
  try {
    const indexes = await Connection.collection.indexes();
    for (const idx of indexes) {
      const keys = Object.keys(idx.key);
      if (keys.includes('requesterId') || keys.includes('addresseeId')) {
        await Connection.collection.dropIndex(idx.name!);
      }
    }
  } catch {
    // Collection may not exist yet — safe to ignore
  }
})();

export default Connection;
