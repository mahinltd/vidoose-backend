/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyInstance } from 'fastify';
import { getAdConfig, confirmAdWatched } from './ad.controller'; // Ensure controller exists

export async function adRoutes(fastify: FastifyInstance) {
  fastify.get('/config', getAdConfig);
  
  // User must be logged in to confirm ad watch
  fastify.post('/confirm', { preHandler: [fastify.authenticate] }, confirmAdWatched);
}