/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from '../../models/user.model';
import { ApiKey } from '../../models/apikey.model';

export const getUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  const users = await User.find().select('-passwordHash').limit(20);
  return reply.send(users);
};

export const banUser = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = req.params as any;
  await User.findByIdAndUpdate(id, { isVerified: false });
  return reply.send({ message: 'User banned' });
};

export const getStats = async (req: FastifyRequest, reply: FastifyReply) => {
  const users = await User.countDocuments();
  const keys = await ApiKey.countDocuments();
  return reply.send({ users, keys });
};