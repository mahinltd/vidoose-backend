/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import IORedis from 'ioredis';
import { env } from './env';

console.log('🔌 Attempting to connect to Redis...');

// Create Redis Connection with specific settings for Upstash/BullMQ
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requirement: MUST be null
  enableReadyCheck: false,    // Faster connection for cloud redis
  family: 4,                  // Force IPv4 (Fixes hanging on Windows/Node 18+)
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisConnection.on('connect', () => {
  console.log('✅ Redis Connection Established');
});

redisConnection.on('ready', () => {
  console.log('✅ Redis Client Ready to accept commands');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

redisConnection.on('close', () => {
  console.log('⚠️ Redis Connection Closed');
});

// Keep connection alive
setInterval(() => {
  if (redisConnection.status === 'ready') {
    redisConnection.ping().catch(() => {});
  }
}, 30000);