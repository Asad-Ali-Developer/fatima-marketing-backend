import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtCookieAuthGuard } from 'src/guards';
import { AdminService, SalesOfficerService } from 'src/services';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly salesOfficerService: SalesOfficerService,
  ) {}

  @ApiOperation({ summary: 'Get paginated sales officers created by admin' })
  @ApiOkResponse({ description: 'Sales officers retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers/created-by-admin')
  async getSalesOfficersCreatedByMe(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    const userId = req.user.userId;

    const result = await this.adminService.getSalesOfficerByAdmin(
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

  @UseGuards(JwtCookieAuthGuard)
  @Get('stats')
  async getDashboardStats(@Req() req) {
    const adminId = req.user.userId;
    const stats = await this.adminService.getAdminDashboardStats(adminId);
    return {
      message: 'Dashboard stats retrieved successfully',
      data: stats,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('trend/daily')
  async getDailyTrend(@Req() req, @Query('days') days: number = 30) {
    const adminId = req.user.userId;
    const trend = await this.adminService.getDailyInvoiceTrend(
      adminId,
      Math.min(90, Math.max(1, days)), // Cap at 90 days
    );
    return {
      message: 'Daily trend retrieved successfully',
      data: trend,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('invoices/by-sales-officer')
  async getInvoicesBySalesOfficer(
    @Req() req,
    @Query('limit') limit: number = 5,
  ) {
    const adminId = req.user.userId;
    const data = await this.salesOfficerService.getInvoicesBySalesOfficer(
      adminId,
      Math.min(20, Math.max(1, limit)),
    );
    return {
      message: 'Invoices by sales officer retrieved successfully',
      data,
      status: true,
    };
  }

  @ApiOperation({
    summary:
      'Get sales officers performance (lead status breakdown) for officers created by this admin',
  })
  @ApiOkResponse({
    description: 'Sales officers performance retrieved successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers/performance')
  async getSalesOfficersPerformance(
    @Req() req,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | 'custom',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const adminId = req.user.userId;
    const data = await this.adminService.getSalesOfficersPerformance(adminId, {
      period: period ?? 'monthly',
      from,
      to,
    });
    return {
      message: 'Sales officers performance retrieved successfully',
      data,
      status: true,
    };
  }

  /**
   * Get a specific sales officer by ID
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers/:id')
  @ApiOperation({ summary: 'Get sales officer by ID' })
  @ApiBearerAuth()
  async getSalesOfficerById(@Req() req, @Param('id') id: string) {
    const adminId = req.user.userId;
    const so = await this.adminService.getSalesOfficerById(adminId, id);
    return {
      message: 'Sales officer retrieved successfully',
      data: so,
      status: true,
    };
  }

  /**
   * Get invoices created by a specific SO (reported to this admin)
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers/:id/invoices')
  @ApiOperation({ summary: 'Get invoices by sales officer ID' })
  @ApiBearerAuth()
  async getInvoicesBySalesOfficerId(
    @Req() req,
    @Param('id') salesOfficerId: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const adminId = req.user.userId;
    const result = await this.adminService.getInvoicesBySalesOfficerId(
      adminId,
      salesOfficerId,
      page ?? 1,
      limit ?? 10,
      { searchTerm, status, date },
    );
    return {
      message: 'Invoices retrieved successfully',
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
