/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  keyHash: string; // HMAC-SHA256 hash of the full key
  prefix: string;  // First 7 chars for identification
  tier: 'free' | 'pro' | 'enterprise';
  monthlyQuota: number;
  usageCount: number;
  revoked: boolean;
}

const ApiKeySchema = new Schema<IApiKey>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true },
  prefix: { type: String, required: true },
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  monthlyQuota: { type: Number, default: 1000 },
  usageCount: { type: Number, default: 0 },
  revoked: { type: Boolean, default: false }
}, { timestamps: true });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);