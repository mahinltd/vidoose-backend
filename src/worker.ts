/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { Worker } from 'bullmq';
import { redisConnection } from './config/redis';
import { connectDB } from './config/db';
import { Job } from './models/job.model';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

console.log('[Worker] Metadata Service Starting...');

connectDB();

// Ensure temp directory exists (Just for cookies)
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper: Get Cookies Path
const getCookiePath = () => {
  const distPath = path.join(process.cwd(), 'dist', 'config', 'cookies.txt');
  if (fs.existsSync(distPath)) return distPath;

  const srcPath = path.join(process.cwd(), 'src', 'config', 'cookies.txt');
  if (fs.existsSync(srcPath)) return srcPath;

  const localConfigPath = path.join(__dirname, 'config', 'cookies.txt');
  if (fs.existsSync(localConfigPath)) return localConfigPath;
  
  if (process.env.YOUTUBE_COOKIES) {
    const tempCookiePath = path.join(tempDir, 'youtube_cookies.txt');
    fs.writeFileSync(tempCookiePath, process.env.YOUTUBE_COOKIES);
    return tempCookiePath;
  }
  return null;
};

const worker = new Worker('video-download-queue', async (job) => {
  console.log(`⚡ Processing Metadata Job: ${job.id}`);
  const { jobId, url } = job.data;

  try {
    await Job.findByIdAndUpdate(jobId, { status: 'processing' });
    console.log(`🎬 Fetching Info for: ${url}`);

    const cookieFile = getCookiePath();
    
    // 🔥 ONLY EXTRACT JSON (No Download)
    let command = `yt-dlp --dump-single-json --no-warnings --no-playlist --force-ipv4 "${url}"`;
    
    if (cookieFile) {
      command += ` --cookies "${cookieFile}"`;
    }

    command += ` --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`;
    
    // Timeout set to 45 seconds (Metadata fetching is fast)
    const { stdout } = await execPromise(command, { timeout: 45000 });
    const videoData = JSON.parse(stdout);

    // --- Process Formats ---
    // আমরা সব ফরম্যাট থেকে শুধু দরকারিগুলো (mp4 with audio) ফিল্টার করব
    const formats = videoData.formats
      .filter((f: any) => f.ext === 'mp4' && f.acodec !== 'none' && f.vcodec !== 'none') // Must have audio & video
      .map((f: any) => ({
        formatId: f.format_id,
        quality: f.height ? `${f.height}p` : 'Unknown',
        filesize: f.filesize || f.filesize_approx || 0,
        url: f.url, // Direct source link
        isPremium: f.height > 720 // 1080p+ requires premium
      }))
      .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality)); // Highest quality first

    // Remove duplicates based on quality
    const uniqueFormats = formats.filter((v: any, i: number, a: any) => a.findIndex((t: any) => (t.quality === v.quality)) === i);

    const metadata = {
      title: videoData.title || 'Unknown Title',
      duration: videoData.duration || 0,
      thumbnail: videoData.thumbnail || '',
      view_count: videoData.view_count || 0,
      uploader: videoData.uploader || 'Unknown',
      platform: videoData.extractor || 'web',
      formats: uniqueFormats // Send list of qualities to frontend
    };

    console.log(`✅ Info Extracted: ${metadata.title} (${uniqueFormats.length} formats)`);

    // Update Job
    await Job.findByIdAndUpdate(jobId, { 
      status: 'ready',
      metadata: metadata,
      downloadUrl: null // No single download URL, frontend will choose from formats
    });

    console.log(`🎉 Job ${jobId} READY.`);

  } catch (err: any) {
    console.error(`❌ Job ${jobId} failed:`, err.message);
    await Job.findByIdAndUpdate(jobId, { 
      status: 'failed', 
      error: err.message 
    });
  }
}, {
  connection: redisConnection,
  concurrency: 10 // Metadata fetching is light, so we can handle more parallel jobs
});

worker.on('completed', job => {
  console.log(`✅ Job ${job.id} queue complete.`);
});

worker.on('failed', (job, err) => {
  console.log(`❌ Job ${job?.id} queue failed.`);
});