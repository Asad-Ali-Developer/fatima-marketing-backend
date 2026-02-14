import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from 'src/DTOs';
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
      secret:
        process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d', // Keep refresh token long
    });

    return { accessToken, refreshToken };
  }

  /**
   * Login with email/password → returns tokens + sets cookies
   */
  async login(loginUserDto: LoginUserDto) {
    const { email, password, rememberMe = false } = loginUserDto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userService.getUserDetailsByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Handle Google OAuth users who have no password
    if (!user.foundUser.password) {
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please log in with Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.foundUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.foundUser,
    );

    // Hash and store refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.foundUser.refreshToken = hashedRefreshToken;
    await user.foundUser.save();

    return { accessToken, refreshToken };
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
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Rotate tokens: issue new pair
      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user);

      // Update DB with new hashed refresh token
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      user.refreshToken = hashedNewRefreshToken;
      await user.save();

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout: clear refresh token from DB
   */
  async logout(userId: string) {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.refreshToken = undefined;
    await user.save();
  }
}
