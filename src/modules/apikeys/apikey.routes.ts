/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyInstance } from 'fastify';
import { createKey, getUsage } from './apikey.controller';

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // 1. Create Key (Requires Login)
  fastify.post('/create', { preHandler: [fastify.authenticate] }, createKey);

  // 2. Check Usage (Requires API Key in Header)
  // No login required, just the x-api-key header
  fastify.get('/usage', getUsage);
}
