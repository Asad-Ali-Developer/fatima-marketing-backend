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

  // ─── NEW: GET LEADS FOR DASHBOARD ───────────────────────────────────
  @ApiOperation({ summary: 'Get leads for current Sales Officer (dashboard)' })
  @ApiBearerAuth()
  @Get('leads')
  async getLeadsForSO(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const soId = req.user.userId;

    const result = await this.salesOfficerService.getLeadsForSalesOfficer(
      soId,
      page ?? 1,
      limit ?? 100, // dashboard may load more
      { searchTerm, status, date },
    );

    return {
      message: 'Leads retrieved successfully',
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

  // ─── NEW: GET INVOICES FOR DASHBOARD ────────────────────────────────
  @ApiOperation({
    summary: 'Get invoices for current Sales Officer (dashboard)',
  })
  @ApiBearerAuth()
  @Get('invoices')
  async getInvoicesForSO(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const soId = req.user.userId;

    const result = await this.salesOfficerService.getInvoicesForSalesOfficer(
      soId,
      page ?? 1,
      limit ?? 100,
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

  // ─── NEW: GET DASHBOARD SUMMARY STATS ───────────────────────────────
  @ApiOperation({ summary: 'Get dashboard summary stats for Sales Officer' })
  @ApiBearerAuth()
  @Get('dashboard-stats')
  async getDashboardStats(@Req() req) {
    const soId = req.user.userId;

    const stats = await this.salesOfficerService.getDashboardStats(soId);

    return {
      message: 'Dashboard stats retrieved successfully',
      data: stats,
      status: true,
    };
  }
}
