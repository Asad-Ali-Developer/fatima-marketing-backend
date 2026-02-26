import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from 'src/DTOs';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from 'src/schemas';
import { UserService } from './User.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  /**
   * Generates new access and refresh tokens
   */
  async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role?.role_type,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d', // Keep refresh token long
    });

    return { accessToken, refreshToken };
  }

  /**
   * Login with email/password → returns tokens + sets cookies
   */
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const res = await this.userService.getUserDetailsByEmail(email);
    if (!res) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!res.foundUser.password) {
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please log in with Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      res.foundUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      res.foundUser,
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // ✅ Push instead of overwrite
    res.foundUser?.refreshTokens?.push(hashedRefreshToken);
    await res.foundUser.save();

    return { accessToken, refreshToken, user: res.foundUser };
  }

  /**
   * Refresh access token using valid refresh token
   */
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userService.getUserDetailsById(payload.sub);

      if (!user || !user.refreshTokens?.length) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 🔎 Find matching token
      let matchedTokenIndex = -1;

      for (let i = 0; i < user.refreshTokens.length; i++) {
        const isMatch = await bcrypt.compare(
          refreshToken,
          user.refreshTokens[i],
        );
        if (isMatch) {
          matchedTokenIndex = i;
          break;
        }
      }

      if (matchedTokenIndex === -1) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 🔁 Rotate tokens (per device rotation)
      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user);

      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      // Replace only this device's token
      user.refreshTokens[matchedTokenIndex] = hashedNewRefreshToken;

      await user.save();

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    const user = await this.userService.getUserDetailsById(userId);

    if (!user || !user.refreshTokens?.length) {
      throw new UnauthorizedException('User not found');
    }

    user.refreshTokens = await Promise.all(
      user.refreshTokens.filter(async (token) => {
        const isMatch = await bcrypt.compare(refreshToken, token);
        return !isMatch;
      }),
    );

    await user.save();
  }
}
