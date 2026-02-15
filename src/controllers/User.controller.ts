import {
  Get,
  Req,
  Res,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { Public } from 'src/decorators';
import {
  LoginUserDto,
  UpdateUserDto,
  RegisterUserDto,
  RegisterAdminDto,
  UpdateUserProfileDto,
  UpdateSalesOfficerDto,
  RegisterSalesOfficerDto,
} from 'src/DTOs';
import { User } from 'src/schemas';
import { JwtCookieAuthGuard } from 'src/guards';
import { AuthService, UserService } from 'src/services';

@ApiTags('Authorization')
@Controller('auth')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

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
  @UseGuards(JwtCookieAuthGuard)
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
  @UseGuards(JwtCookieAuthGuard)
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

  @ApiOperation({ summary: 'Update an existing sales officer' })
  @ApiParam({ name: 'id', description: 'Sales Officer ID', type: String })
  @ApiBody({ type: UpdateSalesOfficerDto }) // Or create UpdateSalesOfficerDto if you prefer
  @ApiOkResponse({ description: 'Sales officer updated successfully' })
  @UseGuards(JwtCookieAuthGuard)
  @Patch('sales-officer/:id')
  async updateSalesOfficer(
    @Req() req,
    @Param('id') salesOfficerId: string,
    @Body() updateDto: UpdateSalesOfficerDto,
  ) {
    const updaterId = req.user?.userId;
    if (!updaterId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const updatedUser = await this.userService.updateSalesOfficer(
      updaterId,
      salesOfficerId,
      updateDto,
    );

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user');
    }

    return {
      message: 'Sales Officer updated successfully',
      data: updatedUser,
      status: true,
    };
  }

  @Public()
  @Post('login')
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { accessToken, refreshToken } =
        await this.authService.login(loginUserDto);

      if (!accessToken) {
        throw new UnauthorizedException('Failed to generate access token');
      }

      // Set accessToken
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 1 * 60 * 1000, // 1 minute for testing
      });

      // Set refreshToken - FIXED: sameSite: 'lax'
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // ✅ Fixed: was 'strict'
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return {
        message: 'Logged in successfully',
        status: true,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid Credentials');
    }
  }

  @Public()
  @Get('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      console.log('❌ No refresh token in cookies');
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refresh(refreshToken);

      // Update access token cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000, // 1 minute for testing
      });

      // Update refresh token cookie - FIXED: sameSite: 'lax'
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // ✅ 30 days
      });

      return {
        message: 'Token refreshed',
        status: true,
      };
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google login' })
  @UseGuards(JwtCookieAuthGuard)
  @Get('google/login')
  googleLogin(@Req() _req) {}

  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google callback' })
  @UseGuards(JwtCookieAuthGuard)
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
  @UseGuards(JwtCookieAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    console.log('Requested User: ', req);

    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.userService.getUserDetails(req.user);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    await this.authService.logout(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Update user profile (email, profile image)' })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Patch('profile-image')
  async updateProfile(
    @Req() req,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const updatedUser = await this.userService.updateProfileImage(
      userId,
      updateUserProfileDto,
    );

    return {
      message: 'Profile updated successfully',
      data: updatedUser,
      status: true,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Patch('profile')
  async updateUser(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const userId = req.user.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const updatedUser = await this.userService.updateUser(
      userId,
      updateUserDto,
    );

    // 🚫 Never return password or showPassword
    const { password, showPassword, ...safeUser } = updatedUser.toObject();
    return safeUser;
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete('users/:id')
  async deleteUser(@Req() req, @Param('id') userId: string) {
    const requestingUserId = req.user.userId;
    if (!requestingUserId) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.userService.deleteUser(requestingUserId, userId);

    return {
      message: 'Sales officer deleted successfully',
      status: true,
    };
  }
}
