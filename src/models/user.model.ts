/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  plan: 'free' | 'premium' | 'enterprise';
  verifyToken?: { tokenHash: string; expiresAt: Date };
  otp?: { hash: string; expiresAt: Date; attempts: number };
  resetPassword?: { tokenHash: string; expiresAt: Date };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
  
  // Auth Fields
  verifyToken: {
    tokenHash: String,
    expiresAt: Date
  },
  otp: {
    hash: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  resetPassword: {
    tokenHash: String,
    expiresAt: Date
  }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);