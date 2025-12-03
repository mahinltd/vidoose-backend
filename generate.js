const fs = require('fs');
const path = require('path');

// Helper to create directory
const createDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Helper to create file
const createFile = (filePath, content) => {
  fs.writeFileSync(filePath, content.trim());
  console.log(`Created file: ${filePath}`);
};

// Project Root
const rootDir = process.cwd();

// --- FILE CONTENTS ---

const packageJson = `
{
  "name": "vidoose-backend",
  "version": "1.0.0",
  "description": "Production grade video downloader backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "dev:worker": "ts-node-dev --respawn --transpile-only src/worker.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:worker": "node dist/worker.js",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "@fastify/autoload": "^5.8.0",
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^8.0.0",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/swagger": "^8.12.0",
    "@fastify/swagger-ui": "^2.0.1",
    "bcrypt": "^5.1.1",
    "bullmq": "^5.1.0",
    "cloudinary": "^2.0.0",
    "dotenv": "^16.3.1",
    "fastify": "^4.26.0",
    "fastify-plugin": "^4.5.1",
    "fluent-ffmpeg": "^2.1.2",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.1.1",
    "resend": "^3.1.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/fluent-ffmpeg": "^2.1.24",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.16",
    "eslint": "^8.56.0",
    "prettier": "^3.2.5",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
`;

const tsConfig = `
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
`;

const dockerfile = `
# Base image with Node.js
FROM node:20-bullseye-slim

# Install system dependencies for yt-dlp and ffmpeg
RUN apt-get update && \\
    apt-get install -y python3 python3-pip ffmpeg curl && \\
    apt-get clean && \\
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip (to get the latest version easily)
RUN python3 -m pip install -U yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (default for Fastify)
EXPOSE 3000

# The CMD is overridden by docker-compose or Render start command
CMD ["npm", "run", "start"]
`;

const dockerCompose = `
version: '3.8'

services:
  api:
    build: .
    command: npm run dev
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - redis
      - mongo
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGO_URI=mongodb://mongo:27017/vidoose

  worker:
    build: .
    command: npm run dev:worker
    env_file: .env
    depends_on:
      - redis
      - mongo
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGO_URI=mongodb://mongo:27017/vidoose

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
`;

const envExample = `
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/vidoose
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=changeme_access
JWT_REFRESH_SECRET=changeme_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RESEND_API_KEY=re_123456789

# Storage: 'cloudinary' or 's3'
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# S3 Config (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

ADMIN_SECRET=admin123
FRONTEND_URL=http://localhost:3000
`;

// --- SOURCE CODE CONTENT ---

const srcEnv = `
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  RESEND_API_KEY: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['cloudinary', 's3']).default('cloudinary'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ADMIN_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
`;

const srcDb = `
import mongoose from 'mongoose';
import { env } from '../config/env';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};
`;

const srcRedis = `
import IORedis from 'ioredis';
import { env } from '../config/env';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => console.log('✅ Redis Connected'));
redisConnection.on('error', (err) => console.error('❌ Redis Error:', err));
`;

// Models
const userModel = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
`;

const jobModel = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  userId?: mongoose.Types.ObjectId;
  url: string;
  urlHash: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  metadata?: any;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

const JobSchema = new Schema<IJob>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  url: { type: String, required: true },
  urlHash: { type: String, required: true, index: true }, // For caching check
  status: { type: String, enum: ['pending', 'processing', 'ready', 'failed'], default: 'pending' },
  metadata: { type: Schema.Types.Mixed },
  downloadUrl: { type: String },
  expiresAt: { type: Date, index: { expires: 0 } }, // Auto-delete
  error: { type: String }
}, { timestamps: true });

export const Job = mongoose.model<IJob>('Job', JobSchema);
`;

// Utils
const queueUtil = `
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
`;

// Controllers
const authController = `
import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { env } from '../config/env';

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = req.body as any;
  
  const existing = await User.findOne({ email });
  if (existing) return reply.status(400).send({ message: 'Email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });

  return reply.status(201).send({ message: 'User created', userId: user._id });
};

export const login = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = req.body as any;
  
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return reply.status(401).send({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    env.JWT_ACCESS_SECRET, 
    { expiresIn: '1d' }
  );

  return reply.send({ token });
};
`;

const downloadController = `
import { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import { Job } from '../models/job.model';
import { addDownloadJob } from '../utils/queue';

export const startDownload = async (req: FastifyRequest, reply: FastifyReply) => {
  const { url } = req.body as any;
  const userId = req.user ? (req.user as any).id : null;
  
  // Create a hash to check if we already processed this recently (optional caching logic layer)
  const urlHash = crypto.createHash('md5').update(url).digest('hex');

  // Create Job
  const job = await Job.create({
    userId,
    url,
    urlHash,
    status: 'pending',
    // Expire job record after 24 hours automatically
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
  });

  // Add to Queue
  await addDownloadJob(job._id.toString(), url, userId?.toString());

  return reply.send({ 
    message: 'Download started', 
    jobId: job._id,
    statusUrl: \`/api/v1/downloads/status/\${job._id}\` 
  });
};

export const checkStatus = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = req.params as any;
  const job = await Job.findById(id);
  
  if (!job) return reply.status(404).send({ message: 'Job not found' });
  
  return reply.send(job);
};
`;

// Routes
const authRoutes = `
import { FastifyInstance } from 'fastify';
import { register, login } from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', register);
  fastify.post('/login', login);
}
`;

const downloadRoutes = `
import { FastifyInstance } from 'fastify';
import { startDownload, checkStatus } from './download.controller';

export async function downloadRoutes(fastify: FastifyInstance) {
  fastify.post('/start', startDownload);
  fastify.get('/status/:id', checkStatus);
}
`;

// Main App & Server
const appTs = `
import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { downloadRoutes } from './modules/downloads/download.routes';

export const buildApp = (): FastifyInstance => {
  const app = fastify({ logger: true });

  // Plugins
  app.register(cors);
  app.register(helmet);
  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });

  // Decorate request with user
  app.decorate("authenticate", async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(downloadRoutes, { prefix: '/api/v1/downloads' });

  app.get('/', async () => {
    return { status: 'ok', service: 'Vidoose API' };
  });

  return app;
};
`;

const serverTs = `
import { buildApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const start = async () => {
  const app = buildApp();
  
  await connectDB();

  try {
    await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
    console.log(\`🚀 Server running on port \${env.PORT}\`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
`;

// --- WORKER SERVICE ---

const workerTs = `
import { Worker } from 'bullmq';
import { redisConnection } from './config/redis';
import { connectDB } from './config/db';
import { Job } from './models/job.model';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execPromise = util.promisify(exec);

console.log('👷 Worker Service Starting...');

connectDB();

const worker = new Worker('video-download-queue', async (job) => {
  console.log(\`Processing Job: \${job.id}\`);
  const { jobId, url } = job.data;

  try {
    // 1. Update status to processing
    await Job.findByIdAndUpdate(jobId, { status: 'processing' });

    // 2. Extract Metadata using yt-dlp (Simulation)
    console.log(\`Running yt-dlp for \${url}\`);
    
    // In production, you would run the actual command:
    // const { stdout } = await execPromise(\`yt-dlp -j "\${url}"\`);
    // const meta = JSON.parse(stdout);
    
    // Simulating delay and result
    await new Promise(r => setTimeout(r, 2000));
    
    // 3. Update Job with success
    await Job.findByIdAndUpdate(jobId, { 
      status: 'ready',
      metadata: { title: 'Sample Video Title', duration: 120 },
      downloadUrl: 'https://example.com/simulated-link' 
    });

    console.log(\`Job \${jobId} completed.\`);

  } catch (err: any) {
    console.error(\`Job \${jobId} failed:\`, err);
    await Job.findByIdAndUpdate(jobId, { 
      status: 'failed', 
      error: err.message 
    });
    throw err;
  }
}, {
  connection: redisConnection,
  concurrency: 5 
});

worker.on('completed', job => {
  console.log(\`Job \${job.id} has completed!\`);
});

worker.on('failed', (job, err) => {
  console.log(\`Job \${job?.id} has failed with \${err.message}\`);
});
`;

// --- FILE MAPPING ---
const filesToCreate = {
  'package.json': packageJson,
  'tsconfig.json': tsConfig,
  'Dockerfile': dockerfile,
  'docker-compose.yml': dockerCompose,
  '.env.example': envExample,
  'src/server.ts': serverTs,
  'src/app.ts': appTs,
  'src/worker.ts': workerTs,
  'src/config/env.ts': srcEnv,
  'src/config/db.ts': srcDb,
  'src/config/redis.ts': srcRedis,
  'src/models/user.model.ts': userModel,
  'src/models/job.model.ts': jobModel,
  'src/utils/queue.ts': queueUtil,
  'src/modules/auth/auth.controller.ts': authController,
  'src/modules/auth/auth.routes.ts': authRoutes,
  'src/modules/downloads/download.controller.ts': downloadController,
  'src/modules/downloads/download.routes.ts': downloadRoutes,
};

// --- EXECUTION ---

console.log('🚀 Starting Vidoose Backend Generation...');

for (const [filePath, content] of Object.entries(filesToCreate)) {
  const fullPath = path.join(rootDir, filePath);
  const dirName = path.dirname(fullPath);
  
  createDir(dirName);
  createFile(fullPath, content);
}

console.log('----------------------------------------------------');
console.log('✅ Project generated successfully!');
console.log('👉 Next Steps:');
console.log('1. npm install');
console.log('2. Create a .env file from .env.example and fill details');
console.log('3. Ensure Redis and Mongo are running (or use docker-compose up)');
console.log('4. Run API: npm run dev');
console.log('5. Run Worker: npm run dev:worker');
console.log('----------------------------------------------------');