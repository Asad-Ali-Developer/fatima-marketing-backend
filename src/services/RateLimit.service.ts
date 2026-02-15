import rateLimit from 'express-rate-limit';

// @Injectable()
// export class RateLimitService implements OnModuleDestroy {
//   constructor(private readonly redisService: RedisService) {}

//   /**
//    * Create a Redis store for rate limiting with the given prefix
//    */
//   private createRedisStore(prefix: string): RedisStore {
//     return new RedisStore({
//       sendCommand: (command: string, ...args: string[]) =>
//         this.redisService
//           .getClient()
//           .call(command, ...args) as Promise<RedisReply>,
//       prefix: `rl:${prefix}:`,
//     });
//   }

//   /**
//    * Skip health checks and Swagger documentation
//    */
//   private skipHealthChecks(req: Request): boolean {
//     const skipPaths = ['/health', '/', '/api/v1', '/api/v1/'];
//     return skipPaths.includes(req.path) || req.path.includes('swagger');
//   }

//   /**
//    * Generate key based on user ID (if authenticated) or IP address
//    */
//   private keyGenerator(req: Request): string {
//     const userId = (req as any).user?.userId;
//     const ip = req.ip || req.socket.remoteAddress || 'unknown';
//     return userId ? `user:${userId}` : `ip:${ip}`;
//   }

//   /**
//    * Global API rate limiter - 100 requests per minute
//    */
//   getGlobalLimiter(): RateLimitRequestHandler {
//     return rateLimit({
//       windowMs: 60 * 1000, // 1 minute
//       max: 100,
//       standardHeaders: true,
//       legacyHeaders: false,
//       skip: (req) => this.skipHealthChecks(req),
//       keyGenerator: (req) => this.keyGenerator(req),
//       store: this.createRedisStore('global'),
//       handler: (req: Request, res: Response) => {
//         console.warn(
//           `🚫 Global rate limit exceeded: ${req.method} ${req.path}`,
//         );
//         res.status(429).json({
//           error: 'Too many requests',
//           message: 'You have exceeded the 100 requests per minute limit',
//           retryAfter: 60,
//         });
//       },
//     });
//   }

//   /**
//    * Authentication endpoints limiter - 10 attempts per 15 minutes
//    * Skips successful requests to not penalize valid users
//    */
//   getAuthLimiter(): RateLimitRequestHandler {
//     return rateLimit({
//       windowMs: 15 * 60 * 1000, // 15 minutes
//       max: 10,
//       standardHeaders: true,
//       legacyHeaders: false,
//       skipSuccessfulRequests: true,
//       keyGenerator: (req) => this.keyGenerator(req),
//       store: this.createRedisStore('auth'),
//       handler: (req: Request, res: Response) => {
//         console.warn(`🚫 Auth rate limit exceeded: ${req.ip}`);
//         res.status(429).json({
//           error: 'Too many login attempts',
//           message: 'Please wait 15 minutes before trying again',
//           retryAfter: 900,
//         });
//       },
//     });
//   }

//   /**
//    * Refresh token endpoint limiter - 5 attempts per 30 seconds
//    * Prevents infinite refresh loops
//    */
//   getRefreshLimiter(): RateLimitRequestHandler {
//     return rateLimit({
//       windowMs: 30 * 1000, // 30 seconds
//       max: 5,
//       standardHeaders: true,
//       legacyHeaders: false,
//       skipFailedRequests: false,
//       keyGenerator: (req) => this.keyGenerator(req),
//       store: this.createRedisStore('refresh'),
//       handler: (req: Request, res: Response) => {
//         console.warn(
//           `🚫 Refresh rate limit exceeded: ${req.ip} - Possible infinite loop detected`,
//         );
//         res.status(429).json({
//           error: 'Too many refresh attempts',
//           message:
//             'Please slow down. Maximum 5 refresh attempts per 30 seconds.',
//           retryAfter: 30,
//         });
//       },
//     });
//   }

//   /**
//    * Strict limiter for sensitive operations - 10 requests per minute
//    */
//   getStrictLimiter(): RateLimitRequestHandler {
//     return rateLimit({
//       windowMs: 60 * 1000,
//       max: 10,
//       standardHeaders: true,
//       legacyHeaders: false,
//       keyGenerator: (req) => this.keyGenerator(req),
//       store: this.createRedisStore('strict'),
//       handler: (req: Request, res: Response) => {
//         res.status(429).json({
//           error: 'Rate limit exceeded',
//           message:
//             'This endpoint is heavily rate limited. Please try again later.',
//           retryAfter: 60,
//         });
//       },
//     });
//   }

//   /**
//    * Graceful shutdown - handled by RedisService
//    */
//   async onModuleDestroy(): Promise<void> {
//     // Redis connection is managed by RedisService
//     console.log('🔴 Rate limiting service destroyed');
//   }
// }

export class RateLimitService {
  constructor() {}

  authenticationLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 5 requests per windowMs for auth routes
      message: 'Too many login attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  refreshLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // slightly more generous for refresh tokens
      message: 'Too many token refresh requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  globalLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}
