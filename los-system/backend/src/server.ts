import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { config } from './shared/config/index.js';
import { logger } from './shared/utils/logger.js';
import { router } from './app/routes/index.js';
import { errorHandler } from './app/middleware/error.middleware.js';
import { apiRateLimiter } from './app/middleware/rate-limit.middleware.js';
import { disconnectDatabase } from './infrastructure/database/prisma.js';
import { disconnectRedis } from './infrastructure/cache/redis.js';
import { startAllWorkers } from './infrastructure/queue/workers/index.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// CORS
app.use(cors({
  origin: config.CORS_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/v1/health' } }));

// Rate limiting
app.use('/api/v1', apiRateLimiter);

// API routes
app.use('/api/v1', router);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'LOS Backend started');
});

// Start background workers
const workers = startAllWorkers();

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  server.close(async () => {
    await workers.shutdown();
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Server shut down gracefully');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app };
