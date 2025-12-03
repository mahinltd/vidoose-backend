import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const downloadQueue = new Queue('video-download-queue', {
  connection: redisConnection,
});

export const addDownloadJob = async (jobId: string, url: string, userId?: string) => {
  await downloadQueue.add('process-video', {
    jobId,
    url,
    userId
  }, {
    removeOnComplete: true,
    removeOnFail: 100
  });
};