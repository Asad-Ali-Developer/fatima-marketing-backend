import 'dotenv/config';

import * as jwt from 'jsonwebtoken';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface ExtendedRequest extends Request {
  user: {
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
  /**
   * Handles the middleware logic.
   *
   * @param {ExtendedRequest} req The Express request object, expected to have a custom type
   * extending the standard `Request` with additional properties.
   * @param {Response} res The Express response object.
   * @param {NextFunction} next The next middleware function in the chain.
   */
  use(req: ExtendedRequest, res: Response, next: NextFunction) {
    // Try to get token from cookies first
    let token = req.cookies?.auth_token;

    if (token) {
      try {
        const decoded = jwt.verify(token, 'fatima-marketing-rehan');

        // Ensure decoded is an object with an 'id' property
        if (
          typeof decoded === 'object' &&
          ('id' in decoded || 'sub' in decoded)
        ) {
          req.user = {
            userId: decoded.id || decoded.sub,
          };
        }
      } catch (error) {
        console.error('Error decoding token', error);
      }
    }

    next();
  }
}
