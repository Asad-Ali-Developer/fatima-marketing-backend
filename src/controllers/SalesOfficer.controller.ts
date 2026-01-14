import { Controller, Get, ParseIntPipe, Query, Req } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { SalesOfficerService } from 'src/services';

@ApiTags('Sales Officer')
@Controller('sales-officer')
export class SalesOfficerController {
  constructor(private readonly salesOfficerService: SalesOfficerService) {}

  @ApiOperation({ summary: 'Get paginated sales officers created by admin' })
  @ApiOkResponse({ description: 'Sales officers retrieved successfully' })
  @ApiBearerAuth()
  @Get('sales-officers/created-by-admin')
  async getSalesOfficersCreatedByMe(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    const userId = req.user.userId;

    const result = await this.salesOfficerService.getSalesOfficerByAdmin(
      userId,
      page ?? 1,
      limit ?? 10,
    );

    return {
      message: 'Sales officers retrieved successfully',
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
