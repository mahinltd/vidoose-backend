/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyInstance } from 'fastify';
import { updateProfile, cancelSubscription } from './user.controller';

export async function userRoutes(fastify: FastifyInstance) {
  // All routes here require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.put('/profile', updateProfile);
  fastify.post('/subscription/cancel', cancelSubscription);
}