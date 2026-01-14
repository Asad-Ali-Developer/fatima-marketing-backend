import { Controller, Get, ParseIntPipe, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SuperAdminService } from 'src/services';

@ApiTags('Super Admin')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @ApiOperation({ summary: 'Get paginated admins created by super admin' })
  @ApiOkResponse({ description: 'Admins retrieved successfully' })
  @ApiBearerAuth()
  @Get('admins/created-by-super-admin')
  async getAdminsCreatedByMe(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    const userId = req.user.userId;

    const result = await this.superAdminService.getAdminsBySuperAdmin(
      userId,
      page ?? 1,
      limit ?? 10,
    );

    return {
      message: 'Admins retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
      status: true,
    };
  }
}
