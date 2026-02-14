import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/services';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // ✅ Remove 'jwt' parameter - use default
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          console.log('Cookie check:', req?.cookies);
          return req?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'fatima-marketing-rehan',
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload);
    const user = await this.userService.getUserDetailsById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      userId: user._id,
      email: user.email,
      role: user.role?.role_type,
    };
  }
}
