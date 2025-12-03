/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // URLs (This fixes your error)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  MONGO_URI: z.string(),
  REDIS_URL: z.string(),

  // Secrets
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  ADMIN_SECRET: z.string(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['cloudinary', 's3']).default('cloudinary'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // PayPal
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_PLAN_ID_PREMIUM: z.string().optional(),
});

export const env = envSchema.parse(process.env);