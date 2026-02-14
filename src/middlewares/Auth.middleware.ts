// import {
//   Injectable,
//   NestMiddleware,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { Request, Response, NextFunction } from 'express';

// // Extend Express Request type to include user
// declare global {
//   namespace Express {
//     interface Request {
//       user?: any;
//     }
//   }
// }

// @Injectable()
// export class AuthMiddleware implements NestMiddleware {
//   constructor(private readonly jwtService: JwtService) {}

//   async use(req: Request, res: Response, next: NextFunction) {
//     // console.log('🔐 AuthMiddleware triggered for:', req.path);

//     try {
//       // 1. Extract token from cookie OR Authorization header
//       let token = req.cookies?.['auth_token'];

//       if (!token) {
//         const authHeader = req.headers.authorization;
//         if (authHeader && authHeader.startsWith('Bearer ')) {
//           token = authHeader.substring(7);
//         }
//       }

//       // console.log('🎫 Token found:', token ? 'YES' : 'NO');

//       if (!token) {
//         throw new UnauthorizedException('No authentication token found');
//       }

//       // 2. Verify the token
//       const decoded = this.jwtService.verify(token, {
//         secret: 'fatima-marketing-rehan', // Use same secret as in UserService
//       });

//       // console.log('✅ Token decoded:', decoded);

//       // 3. Attach user data to request - CRITICAL: Extract userId properly
//       req.user = {
//         userId: decoded.id || decoded.sub, // Use 'id' or 'sub' from JWT payload
//         email: decoded.email,
//         role: decoded.role,
//       };

//       // console.log('👤 User attached to request:', req.user);

//       next();
//     } catch (error) {
//       console.error('❌ Auth middleware error:', error.message);
//       throw new UnauthorizedException('Invalid or expired token');
//     }
//   }
// }
