import 'dotenv/config';
import * as jwt from 'jsonwebtoken';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Extend Express Request to include user object
interface ExtendedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

/**
 * Middleware that validates and parses the JWT token from cookies or authorization header.
 *
 * This middleware first checks for a token in the cookies (auth_token).
 * If not found, it checks the authorization header for a Bearer token.
 * If the token is valid, it decodes the token using the secret key stored
 * in the environment variable `JWT_SECRET_KEY`. If successful, it
 * extracts the user ID and role from the decoded payload and attaches them to the request object
 * under the `user` property. Any other information in the decoded payload is also included
 * in the `user` object.
 *
 * If the token is invalid or missing, the middleware continues the request chain by calling
 * `next()`. However, any subsequent middleware or route handlers can access the presence
 * or absence of a valid token through the `req.user` property.
 *
 * @throws {Error} (internally) If an error occurs during token decoding.
 *
 * @class JWTMiddleware
 * @implements NestMiddleware
 */
@Injectable()
export class JWTMiddleware implements NestMiddleware {
  use(req: ExtendedRequest, res: Response, next: NextFunction) {
    let token = req.cookies?.auth_token;

    console.log(
      '[JWTMiddleware] Token from cookies:',
      token ? '✅ Found' : '❌ Not found',
    );

    // If no token in cookies, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log(
          '[JWTMiddleware] Token from header:',
          token ? '✅ Found' : '❌ Not found',
        );
      }
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);

        // Ensure decoded is an object and has at least one identifier field
        if (
          typeof decoded === 'object' &&
          ('id' in decoded || 'sub' in decoded)
        ) {
          req.user = {
            userId: decoded.id || decoded.sub,
            ...decoded, // Spread all other properties
          };
          console.log('[JWTMiddleware] User attached to request:', req.user);
        } else {
          console.warn(
            '[JWTMiddleware] Token payload missing required fields (id or sub)',
          );
        }
      } catch (error) {
        console.error(
          '[JWTMiddleware] Error decoding token:',
          error.message || error,
        );
        // Optionally, you could set req.user = null or leave it undefined
      }
    } else {
      console.log('[JWTMiddleware] No token found. Proceeding without user.');
    }

    next();
  }
}
