/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { redisConnection } from '../../config/redis';
import crypto from 'crypto';

export const getAdConfig = async (req: FastifyRequest, reply: FastifyReply) => {
  return reply.send({
    showAds: true,
    adProvider: 'google-ima',
    skippableAfter: 5,
    required: true
  });
};

export const confirmAdWatched = async (req: FastifyRequest, reply: FastifyReply) => {
  // FIX: Logic must match download.controller.ts exactly
  const userId = req.user ? (req.user as any).id : 'guest';
  const { jobId } = req.body as any;

  if (!jobId) {
    return reply.status(400).send({ message: 'Job ID is required' });
  }

  // Generate a temporary Ad Token
  const adToken = crypto.randomBytes(16).toString('hex');
  
  // Key format: ad_token:USER_ID_OR_GUEST:JOB_ID
  const key = `ad_token:${userId}:${jobId}`;

  console.log(`🔑 Generating Ad Token for Key: ${key}`); // Debug Log

  // Store in Redis with 5 minutes TTL
  await redisConnection.set(key, adToken, 'EX', 300);

  return reply.send({ 
    success: true, 
    adToken,
    message: 'Ad verified. You can now download.' 
  });
};