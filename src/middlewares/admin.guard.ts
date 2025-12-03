/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyRequest, FastifyReply } from 'fastify';

export const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = req.user as any;
  if (!user || user.role !== 'admin') {
    return reply.status(403).send({ message: 'Access Denied: Admin Only' });
  }
};