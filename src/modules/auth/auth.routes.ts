/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyInstance } from 'fastify';
import { 
  register, 
  login, 
  verifyOTP, 
  verifyEmail, 
  forgotPassword, 
  resetPassword,
  getMe // Import getMe
} from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // Public Routes
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.post('/verify-otp', verifyOTP);
  
  fastify.get('/verify-email', verifyEmail);
  fastify.post('/verify-email', verifyEmail);
  
  fastify.post('/forgot-password', forgotPassword);
  fastify.post('/reset-password', resetPassword);

  // Protected Route (Requires Token)
  // This allows frontend to fetch user profile using the token
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getMe);
}
