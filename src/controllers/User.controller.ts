import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from 'src/decorators';
import { LoginUserDto, RegisterUserDto } from 'src/DTOs';
import { JWTMiddleware } from 'src/middlewares/Jwt.middleware';
import { UserService } from 'src/services';

@ApiTags('Authorization') // Grouping the endpoints under a single tag
@Controller('auth') // Base route for this controller
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Endpoint to register a new user.
   * @param registerUserDto - Data transfer object containing user registration data.
   * @returns A success message and the registered user's data (excluding the password).
   */

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiOkResponse({ description: 'User registered successfully' })
  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.userService.registerUser(registerUserDto);

    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({ description: 'User logged in successfully' })
  @Post('login')
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password, rememberMe } = loginUserDto;
    console.log('Data: ', loginUserDto);
    try {
      const { accessToken } = await this.userService.loginUser({
        email,
        password,
        rememberMe,
      });

      if (!accessToken) {
        throw new UnauthorizedException('Failed to generate access token');
      }

      const cookieOptions = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 60 * 60 * 1000; // 30 days or 1 hour
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: cookieOptions,
        domain: 'localhost',
      });

      return {
        message: 'Logged in successfully',
        accessToken,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid Credentials');
    }
  }

  @ApiOperation({ summary: 'Verify token' })
  @ApiOkResponse({ description: 'Token verified successfully' })
  @Get('verify-token')
  async verifyToken(@Req() req) {
    const token = req.cookies['auth_token'];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const decoded = this.jwtService.verify(token);
      return { valid: true, user: decoded };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google login' })
  @Get('google/login')
  googleLogin(@Req() _req) {}

  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google callback' })
  @Get('google/callback')
  async googleCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.userService.googleLogin(req.user);

    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(
      process.env.NODE_ENV === 'production'
        ? `${process.env.FRONTEND_URL}?token=${accessToken}&isGoogle=true`
        : 'http://localhost:3000?token=' + accessToken + '&isGoogle=true',
    );
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiOkResponse({ description: 'User profile fetched successfully' })
  @UseGuards(JWTMiddleware)
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@Req() req) {
    const user = req.user;
    return this.userService.getUserDetails(user);
  }

  // logout endpoint
  @ApiOperation({ summary: 'Logout' })
  @ApiOkResponse({ description: 'User logged out successfully' })
  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { message: 'Logged out successfully' };
  }
}
