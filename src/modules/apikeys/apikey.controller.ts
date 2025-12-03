/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiKey } from '../../models/apikey.model';
import crypto from 'crypto';
import { env } from '../../config/env';

// 1. Create API Key (For Dashboard)
export const createKey = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = req.user as any;
  const { name } = req.body as any;

  // Generate a secure random key
  const rawKey = `vk_${crypto.randomBytes(24).toString('hex')}`;
  
  // Hash it before storing
  const keyHash = crypto.createHmac('sha256', env.ADMIN_SECRET).update(rawKey).digest('hex');

  await ApiKey.create({
    ownerId: user.id,
    name,
    keyHash,
    prefix: rawKey.substring(0, 7), // To show "vk_1234..." in UI
    monthlyQuota: 1000 // Default quota
  });

  // Return the raw key ONLY ONCE
  return reply.send({ 
    message: 'API Key created successfully',
    apiKey: rawKey 
  });
};

// 2. Get Usage Stats (Using x-api-key header)
export const getUsage = async (req: FastifyRequest, reply: FastifyReply) => {
  const apiKeyHeader = req.headers['x-api-key'] as string;

  if (!apiKeyHeader) {
    return reply.status(401).send({ message: 'Missing x-api-key header' });
  }

  // Hash the incoming key to match DB
  const hash = crypto.createHmac('sha256', env.ADMIN_SECRET).update(apiKeyHeader).digest('hex');

  const keyDoc = await ApiKey.findOne({ keyHash: hash });

  if (!keyDoc) {
    return reply.status(403).send({ message: 'Invalid API Key' });
  }

  return reply.send({
    name: keyDoc.name,
    tier: keyDoc.tier,
    usage: keyDoc.usageCount,
    quota: keyDoc.monthlyQuota,
    remaining: keyDoc.monthlyQuota - keyDoc.usageCount,
    active: !keyDoc.revoked
  });
};
