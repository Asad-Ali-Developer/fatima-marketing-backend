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
import {
  LoginUserDto,
  RegisterAdminDto,
  RegisterSalesOfficerDto,
  RegisterUserDto,
} from 'src/DTOs';
import { UserService } from 'src/services';

@ApiTags('Authorization')
@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiOkResponse({ description: 'User registered successfully' })
  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.userService.registerUser(registerUserDto);

    return {
      message: 'User registered successfully',
      data: user,
      status: true,
    };
  }

  @ApiOperation({ summary: 'Register a new Admin' })
  @ApiBody({ type: RegisterAdminDto })
  @ApiOkResponse({
    description: 'Admin registered successfully',
  })
  @Post('register-admin')
  async registerAdmin(@Req() req, @Body() registerAdminDto: RegisterAdminDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.userService.registerAdmin(userId, registerAdminDto);

    const roleType = registerAdminDto.role.role_type;

    return {
      message: `${roleType} registered successfully`,
      data: user,
      status: true,
    };
  }

  @ApiOperation({ summary: 'Register a new sales officer' })
  @ApiBody({ type: RegisterSalesOfficerDto })
  @ApiOkResponse({
    description: 'Sales officer registered successfully',
  })
  @Post('register-sales-officer')
  async registerSalesOfficer(
    @Req() req,
    @Body() registerSalesOfficerDto: RegisterSalesOfficerDto,
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.userService.registerSalesOfficer(
      userId,
      registerSalesOfficerDto,
    );

    const roleType = registerSalesOfficerDto.role.role_type;

    return {
      message: `${roleType} registered successfully`,
      data: user,
      status: true,
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
        : 60 * 60 * 1000;

      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: cookieOptions,
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      });

      return {
        message: 'Logged in successfully',
        accessToken,
        status: true,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid Credentials');
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
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@Req() req) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.userService.getUserDetails(req.user);
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiOkResponse({ description: 'User logged out successfully' })
  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { message: 'Logged out successfully' };
  }
}
