import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  userId?: mongoose.Types.ObjectId;
  url: string;
  urlHash: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  metadata?: any;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

const JobSchema = new Schema<IJob>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  url: { type: String, required: true },
  urlHash: { type: String, required: true, index: true }, // For caching check
  status: { type: String, enum: ['pending', 'processing', 'ready', 'failed'], default: 'pending' },
  metadata: { type: Schema.Types.Mixed },
  downloadUrl: { type: String },
  expiresAt: { type: Date, index: { expires: 0 } }, // Auto-delete
  error: { type: String }
}, { timestamps: true });

export const Job = mongoose.model<IJob>('Job', JobSchema);