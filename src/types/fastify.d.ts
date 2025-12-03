/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}