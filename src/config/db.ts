import mongoose from 'mongoose';
import { env } from '../config/env';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};