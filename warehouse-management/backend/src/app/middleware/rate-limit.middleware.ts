import { Request, Response, NextFunction } from 'express';
import { redis } from '../../infrastructure/cache/redis.js';
import { RateLimitError } from '../../shared/errors/index.js';

interface RateLimitOptions {
  windowMs: number;
  maxAttempts: number;
  keyPrefix: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxAttempts, keyPrefix } = options;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxAttempts) {
        const ttl = await redis.ttl(key);
        return next(new RateLimitError(ttl));
      }

      next();
    } catch {
      // If Redis is down, allow the request through
      next();
    }
  };
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  keyPrefix: 'wms:ratelimit:auth',
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxAttempts: 100,
  keyPrefix: 'wms:ratelimit:api',
});
