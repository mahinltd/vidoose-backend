/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import axios from 'axios'; // For proxy streaming
import { Job } from '../../models/job.model';
import { User } from '../../models/user.model';
import { addDownloadJob } from '../../utils/queue';
import { redisConnection } from '../../config/redis';

// --- Interfaces ---
interface StartDownloadBody {
  url: string;
}

interface CheckStatusParams {
  id: string;
}

interface GetLinkBody {
  jobId: string;
  adToken: string;
}

interface HistoryQuery {
  page?: number;
  limit?: number;
}

interface StreamQuery {
  url: string;
  title?: string;
}

// --- 1. Start Download Process ---
export const startDownload = async (
  req: FastifyRequest<{ Body: StartDownloadBody }>, 
  reply: FastifyReply
) => {
  console.log('🚀 [Step 1] Download request received');

  const { url } = req.body;
  const userId = req.user ? (req.user as any).id : null;

  if (!url || !url.startsWith('http')) {
    return reply.status(400).send({ message: 'Invalid URL provided' });
  }
  
  try {
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const cacheKey = `meta:${urlHash}`;

    // Smart Caching
    const cachedData = await redisConnection.get(cacheKey);

    if (cachedData) {
      console.log('🚀 Serving from Cache');
      const cachedJob = JSON.parse(cachedData);
      return reply.send({ 
        message: 'Download started (Cached)', 
        jobId: cachedJob._id,
        statusUrl: `/api/v1/downloads/status/${cachedJob._id}` 
      });
    }

    // New Job
    console.log('⏳ Creating Job in MongoDB...');
    const job = await Job.create({
      userId,
      url,
      urlHash,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
    });

    await addDownloadJob(job._id.toString(), url, userId?.toString());

    return reply.send({ 
      message: 'Download started', 
      jobId: job._id,
      statusUrl: `/api/v1/downloads/status/${job._id}` 
    });

  } catch (error) {
    console.error('❌ [ERROR] Start Failed:', error);
    return reply.status(500).send({ message: 'Internal Server Error', error });
  }
};

// --- 2. Check Job Status ---
export const checkStatus = async (
  req: FastifyRequest<{ Params: CheckStatusParams }>, 
  reply: FastifyReply
) => {
  const { id } = req.params;
  const userId = req.user ? (req.user as any).id : null;

  try {
    const job = await Job.findById(id).lean();
    
    if (!job) return reply.status(404).send({ message: 'Job not found' });
    
    if (job.status !== 'ready') {
      return reply.send(job);
    }

    // Ad Gating Logic
    let isPremium = false;
    if (userId) {
      const user = await User.findById(userId);
      if (user && (user.plan === 'premium' || user.plan === 'enterprise')) {
        isPremium = true;
      }
    }

    if (!isPremium) {
      return reply.send({
        ...job,
        downloadUrl: null, // Masked
        requiresAd: true,
        adConfigUrl: '/api/v1/ads/config',
        unlockUrl: '/api/v1/downloads/get-link'
      });
    }

    return reply.send(job);

  } catch (error) {
    return reply.status(500).send({ message: 'Error checking status' });
  }
};

// --- 3. Get Real Link ---
export const getDownloadLink = async (
  req: FastifyRequest<{ Body: GetLinkBody }>, 
  reply: FastifyReply
) => {
  const { jobId, adToken } = req.body;
  const userId = req.user ? (req.user as any).id : 'guest';

  if (!jobId || !adToken) {
    return reply.status(400).send({ message: 'Missing Job ID or Ad Token' });
  }

  try {
    const redisKey = `ad_token:${userId}:${jobId}`;
    const storedToken = await redisConnection.get(redisKey);

    if (!storedToken || storedToken !== adToken) {
      return reply.status(402).send({ 
        message: 'Invalid Ad Token',
        code: 'AD_VERIFICATION_FAILED' 
      });
    }

    const job = await Job.findById(jobId);
    if (!job) return reply.status(404).send({ message: 'Job not found' });

    return reply.send({
      success: true,
      downloadUrl: job.downloadUrl,
      metadata: job.metadata
    });
  } catch (error) {
    return reply.status(500).send({ message: 'Error retrieving link' });
  }
};

// --- 4. Get History ---
export const getDownloadHistory = async (
  req: FastifyRequest<{ Querystring: HistoryQuery }>, 
  reply: FastifyReply
) => {
  const userId = (req.user as any).id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const jobs = await Job.find({ userId, status: 'ready' })
      .select('url metadata createdAt status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Job.countDocuments({ userId, status: 'ready' });

    return reply.send({
      success: true,
      data: jobs,
      pagination: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    return reply.status(500).send({ message: 'Error fetching history' });
  }
};

// --- 5. Stream Video (Proxy for TikTok/FB) - NEW ---
export const streamVideo = async (
  req: FastifyRequest<{ Querystring: StreamQuery }>,
  reply: FastifyReply
) => {
  const { url, title } = req.query;

  if (!url) {
    return reply.status(400).send({ message: 'URL is required' });
  }

  try {
    // Fetch the video from the source (e.g., TikTok CDN)
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        // User-Agent is crucial to avoid 403 Forbidden
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/' 
      }
    });

    // Forward Headers
    reply.header('Content-Type', response.headers['content-type'] || 'video/mp4');
    reply.header('Content-Length', response.headers['content-length']);
    
    // Force Download
    const filename = title ? `${title.replace(/[^a-z0-9]/gi, '_')}.mp4` : 'video_download.mp4';
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream data to client
    return reply.send(response.data);

  } catch (error) {
    console.error('❌ [Stream Error]:', error);
    return reply.status(502).send({ message: 'Failed to stream video. Source link might be expired.' });
  }
};