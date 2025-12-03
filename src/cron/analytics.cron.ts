/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { redisConnection } from '../config/redis';
// You'll need an Analytics Model similar to AdminLog but simpler

export const flushAnalytics = async () => {
  console.log('📊 Flushing analytics from Redis to DB...');
  
  const keys = await redisConnection.keys('events:*:*'); // events:download:20251201
  
  for (const key of keys) {
    const count = await redisConnection.get(key);
    if (count) {
      const [_, event, date] = key.split(':');
      // Save to MongoDB here...
      // await Analytics.create({ event, date, count: parseInt(count) });
      
      // Clear Redis key
      await redisConnection.del(key);
    }
  }
};

// Call this function inside setInterval in server.ts (e.g., every 24 hours)