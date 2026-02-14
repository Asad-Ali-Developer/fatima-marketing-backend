// import { Injectable, OnModuleDestroy } from '@nestjs/common';
// import Redis from 'ioredis';

// @Injectable()
// export class RedisService implements OnModuleDestroy {
//   private client: Redis;

//   constructor() {
//     this.client = new Redis({
//       host: process.env.REDIS_HOST || '127.0.0.1',
//       port: parseInt(process.env.REDIS_PORT || '8081'),
//       password: process.env.REDIS_PASSWORD || undefined,
//       retryStrategy: (times) => Math.min(times * 50, 2000),
//       enableOfflineQueue: false,
//     });

//     this.client.on('connect', () => console.log('🔴 Redis connected'));
//     this.client.on('error', (err) => console.error('❌ Redis error:', err));
//   }

//   getClient(): Redis {
//     return this.client;
//   }

//   async onModuleDestroy(): Promise<void> {
//     await this.client.quit();
//     console.log('🔴 Redis connection closed');
//   }
// }