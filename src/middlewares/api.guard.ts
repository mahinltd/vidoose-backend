/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiKey } from '../models/apikey.model';
import { redisConnection } from '../config/redis';
import crypto from 'crypto';

export const apiKeyGuard = async (req: FastifyRequest, reply: FastifyReply) => {
  const key = req.headers['x-api-key'] as string;
  if (!key) return reply.status(401).send({ message: 'Missing API Key' });

  const hash = crypto.createHmac('sha256', process.env.ADMIN_SECRET!).update(key).digest('hex');
  
  // Try Cache First
  const cacheKey = `apikey:${hash}`;
  const cached = await redisConnection.get(cacheKey);
  
  let keyDoc;
  if (cached) {
    keyDoc = JSON.parse(cached);
  } else {
    keyDoc = await ApiKey.findOne({ keyHash: hash, revoked: false });
    if (keyDoc) {
      await redisConnection.set(cacheKey, JSON.stringify(keyDoc), 'EX', 60); // Cache for 1 min
    }
  }

  if (!keyDoc) return reply.status(403).send({ message: 'Invalid API Key' });

  // Check Quota (Redis Counter)
  const usageKey = `usage:${keyDoc._id}:${new Date().toISOString().slice(0, 7)}`; // Monthly
  const currentUsage = await redisConnection.incr(usageKey);

  if (currentUsage > keyDoc.monthlyQuota) {
    return reply.status(429).send({ message: 'Monthly Quota Exceeded' });
  }

  // Attach to request
  (req as any).apiKey = keyDoc;
};