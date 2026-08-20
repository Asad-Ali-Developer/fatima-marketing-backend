import {
  Controller,
  Get,
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
import { SalesOfficerService } from 'src/services';

@ApiTags('Sales Officer')
@Controller('sales-officer')
export class SalesOfficerController {
  constructor(private readonly salesOfficerService: SalesOfficerService) {}

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
  @UseGuards(JwtCookieAuthGuard)
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

  // ─── NEW: GET ASSIGNED LEADS FOR DASHBOARD ───────────────────────────────────
  @ApiOperation({ summary: 'Get leads for current Sales Officer (dashboard)' })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Get('assigned-leads')
  async getAssignedLeadsForSO(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const soId = req.user.userId;

    const result =
      await this.salesOfficerService.getAssignedLeadsForSalesOfficer(
        soId,
        page ?? 1,
        limit ?? 100, // dashboard may load more
        { searchTerm, status, date },
      );

    return {
      message: 'Assigned Leads retrieved successfully',
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
  @UseGuards(JwtCookieAuthGuard)
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
  @UseGuards(JwtCookieAuthGuard)
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

  /**
   * ── Routes added to SalesOfficerController ────────────────────────────────
   * Matches the auth pattern already used by getDashboardStats: guarded with
   * JwtCookieAuthGuard, soId read from req.user.userId (NOT req.user.id —
   * that was the bug causing "Cannot read properties of undefined (reading 'id')").
   */

  @Get('stats')
  @ApiOperation({
    summary: 'Get lead status counts and 7-day trend for Sales Officer',
  })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  async getStats(@Req() req: any) {
    const soId = req.user.userId;
    return this.salesOfficerService.getLeadStats(soId);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's assigned leads for Sales Officer" })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  async getTodayLeads(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const soId = req.user.userId;
    return this.salesOfficerService.getTodayAssignedLeads(
      soId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get('calendar')
  @ApiOperation({
    summary: 'Get weekly calendar lead report for Sales Officer',
  })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  async getCalendar(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string,
  ) {
    const soId = req.user.userId;
    return this.salesOfficerService.getLeadsCalendar(
      soId,
      startDate,
      endDate,
      status,
    );
  }

  @Get('needs-attention')
  @ApiOperation({
    summary: 'Get stalled/needs-attention leads for Sales Officer',
  })
  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  async getNeedsAttention(
    @Req() req: any,
    @Query('date') date?: string,
    @Query('range') range?: 'today' | '7d' | '30d',
    @Query('limit') limit?: string,
  ) {
    const soId = req.user.userId;
    return this.salesOfficerService.getNeedsAttentionLeads(soId, {
      date,
      range,
      limit: limit ? Number(limit) : undefined,
    });
  }

  
}
