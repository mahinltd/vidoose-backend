/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  paypalSubscriptionId: string;
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paypalSubscriptionId: { type: String, required: true },
  plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  currentPeriodEnd: { type: Date },
}, { timestamps: true });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);