// import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
// import { RedisStore, RedisReply } from 'rate-limit-redis';
// import Redis from 'ioredis';
// import { Request, Response } from 'express';

// // Redis client for distributed rate limiting
// const redisClient = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   password: process.env.REDIS_PASSWORD || undefined,
//   retryStrategy: (times) => Math.min(times * 50, 2000),
//   enableOfflineQueue: false,
// });

// redisClient.on('connect', () =>
//   console.log('🔴 Redis connected for rate limiting'),
// );

// redisClient.on('error', (err) => console.error('Redis error:', err));

// // Create Redis store factory - FIXED for ioredis
// const createRedisStore = (prefix: string) => {
//   return new RedisStore({
//     // ✅ CORRECT syntax for ioredis v5+ with rate-limit-redis v4+
//     sendCommand: (command: string, ...args: string[]) =>
//       redisClient.call(command, ...args) as Promise<RedisReply>,
//     prefix: `rl:${prefix}:`,
//   });
// };

// // Skip function for health checks and Swagger
// const skipHealthChecks = (req: Request) => {
//   const skipPaths = ['/health', '/', '/api/v1', '/api/v1/'];
//   return skipPaths.includes(req.path) || req.path.includes('swagger');
// };

// // Key generator - use user ID if authenticated, otherwise IP
// const keyGenerator = (req: Request) => {
//   const userId = (req as any).user?.userId;
//   const ip = req.ip || req.socket.remoteAddress || 'unknown';
//   return userId ? `user:${userId}` : `ip:${ip}`;
// };

// // Global API rate limiter - 100 requests per minute
// export const globalLimiter: RateLimitRequestHandler = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: skipHealthChecks,
//   keyGenerator,
//   store: createRedisStore('global'),
//   handler: (req: Request, res: Response) => {
//     console.warn(`🚫 Global rate limit exceeded: ${req.method} ${req.path}`);
//     res.status(429).json({
//       error: 'Too many requests',
//       message: 'You have exceeded the 100 requests per minute limit',
//       retryAfter: 60,
//     });
//   },
// });

// // Authentication endpoints - 5 attempts per 15 minutes (brute force protection)
// export const authLimiter: RateLimitRequestHandler = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   skipSuccessfulRequests: true, // Don't count successful logins
//   keyGenerator,
//   store: createRedisStore('auth'),
//   handler: (req: Request, res: Response) => {
//     console.warn(`🚫 Auth rate limit exceeded: ${req.ip}`);
//     res.status(429).json({
//       error: 'Too many login attempts',
//       message: 'Please wait 15 minutes before trying again',
//       retryAfter: 900,
//     });
//   },
// });

// // Refresh token endpoint - 5 attempts per 30 seconds (prevents infinite loops)
// export const refreshLimiter: RateLimitRequestHandler = rateLimit({
//   windowMs: 30 * 1000, // 30 seconds
//   max: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   skipFailedRequests: false,
//   keyGenerator,
//   store: createRedisStore('refresh'),
//   handler: (req: Request, res: Response) => {
//     console.warn(
//       `🚫 Refresh rate limit exceeded: ${req.ip} - Possible infinite loop detected`,
//     );
//     res.status(429).json({
//       error: 'Too many refresh attempts',
//       message: 'Please slow down. Maximum 5 refresh attempts per 30 seconds.',
//       retryAfter: 30,
//     });
//   },
// });

// // Strict limiter for sensitive operations - 10 requests per minute
// export const strictLimiter: RateLimitRequestHandler = rateLimit({
//   windowMs: 60 * 1000,
//   max: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator,
//   store: createRedisStore('strict'),
//   handler: (req: Request, res: Response) => {
//     res.status(429).json({
//       error: 'Rate limit exceeded',
//       message: 'This endpoint is heavily rate limited. Please try again later.',
//       retryAfter: 60,
//     });
//   },
// });

// // Webhook limiter - higher limit for automated systems
// export const webhookLimiter: RateLimitRequestHandler = rateLimit({
//   windowMs: 60 * 1000,
//   max: 1000,
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) => `webhook:${req.ip}`,
//   store: createRedisStore('webhook'),
// });

// // Graceful shutdown handler
// export const closeRateLimitRedis = async () => {
//   await redisClient.quit();
//   console.log('🔴 Redis rate limit connection closed');
// };
