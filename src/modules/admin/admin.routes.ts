/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyInstance } from 'fastify';
import { getUsers, banUser, getStats } from './admin.controller'; // Ensure controller exists
import { adminGuard } from '../../middlewares/admin.guard';

export async function adminRoutes(fastify: FastifyInstance) {
  // Protect all routes in this scope
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', adminGuard);

  fastify.get('/users', getUsers);
  fastify.post('/users/:id/ban', banUser);
  fastify.get('/stats', getStats);
}