/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import compression from '@fastify/compress'; // NEW: Compression Plugin
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { redisConnection } from './config/redis';

// --- Import All Routes ---
import { authRoutes } from './modules/auth/auth.routes';
import { downloadRoutes } from './modules/downloads/download.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { adRoutes } from './modules/ads/ad.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { seoRoutes } from './modules/seo/seo.routes';
import { apiKeyRoutes } from './modules/apikeys/apikey.routes';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({ 
    logger: true, 
    trustProxy: true 
  });

  // 1. Swagger Documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Vidoose API',
        description: 'Enterprise Grade Video Downloader API',
        version: '1.0.0',
        contact: {
          name: 'Vidoose Support',
          email: 'support@vidoose.app'
        }
      },
      host: 'api.vidoose.app',
      schemes: ['https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        },
        apiKey: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header'
        }
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // 2. Performance Optimization (Compression) - NEW
  // This compresses JSON responses using gzip/brotli to save bandwidth
  await app.register(compression, { global: true });

  // 3. Global Security Plugins
  app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        cb(null, true);
        return;
      }

      const allowedOrigins = [
        'https://vidoose.app', 
        'https://www.vidoose.app',
        'https://admin.vidoose.app',
        'https://api.vidoose.app',
        // Localhost allowed for dev testing
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ];
      
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        // Log blocked origin for debugging
        console.log(`🚫 Blocked Origin: ${origin}`);
        cb(new Error("🚫 Blocked by CORS: Unauthorized Domain"), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  app.register(helmet);

  // Rate Limiting (DDOS Protection)
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: redisConnection,
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.ttl}ms.`
    })
  });

  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });

  app.decorate("authenticate", async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: 'Unauthorized: Invalid Token' });
    }
  });

  // 4. Global Error Handler (Self-Healing Strategy)
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error); // Log to system

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message
      });
    }

    // Rate Limit Error handling specifically
    if (error.statusCode === 429) {
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'You are hitting the server too fast! Slow down.'
      });
    }

    // Don't crash, send nice error
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Something went wrong. Our team has been notified.'
    });
  });

  // --- Routes ---
  app.get('/', async () => ({ status: 'ok', service: 'Vidoose API v1.0' }));
  app.get('/health', async () => ({ status: 'healthy', uptime: process.uptime() }));

  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(downloadRoutes, { prefix: '/api/v1/downloads' });
  app.register(adminRoutes, { prefix: '/api/v1/admin' });
  app.register(adRoutes, { prefix: '/api/v1/ads' });
  app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  app.register(seoRoutes, { prefix: '/api/v1/seo' });
  app.register(apiKeyRoutes, { prefix: '/api/v1/apikeys' });

  return app;
};