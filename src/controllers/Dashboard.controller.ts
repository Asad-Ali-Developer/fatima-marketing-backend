import {
  Req,
  Get,
  Query,
  Controller,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtCookieAuthGuard } from 'src/guards';
import { DashboardService } from 'src/services';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get all dashboard statistics usual
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get comprehensive dashboard statistics',
    description:
      'Returns key metrics including sales officers, leads, invoices, inventory, and expenses',
  })
  async getDashboardStats(@Req() req) {
    const userId = req.user.userId;
    const stats = await this.dashboardService.getDashboardStats(userId);

    return {
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
      status: true,
    };
  }

  /**
   * Get expense summary
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('expenses/summary')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get expense summary for different time periods',
    description:
      'Returns expense totals for today, yesterday, last 7 days, last 30 days, this month, and last month',
  })
  async getExpenseSummary(@Req() req) {
    const userId = req.user.userId;
    const summary = await this.dashboardService.getExpenseSummary(userId);

    return {
      message: 'Expense summary retrieved successfully',
      data: summary,
      status: true,
    };
  }

  /**
   * Get expense trends
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('expenses/trends')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get expense trends (week over week comparison)',
    description:
      'Returns current week vs previous week expense comparison with percentage change',
  })
  async getExpenseTrends(@Req() req) {
    const userId = req.user.userId;
    const trends = await this.dashboardService.getExpenseTrends(userId);

    return {
      message: 'Expense trends retrieved successfully',
      data: trends,
      status: true,
    };
  }

  /**
   * Get sales officers performance
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('officers/performance')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sales officers performance with lead statistics',
    description:
      'Returns all sales officers with their lead counts by status and completion rates',
  })
  async getOfficersPerformance(@Req() req) {
    const userId = req.user.userId;
    const performance =
      await this.dashboardService.getOfficersPerformance(userId);

    return {
      message: 'Sales officers performance retrieved successfully',
      data: performance,
      status: true,
    };
  }

  /**
   * Get invoice statistics
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('invoices/stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get invoice statistics',
    description:
      'Returns invoice counts by status, approval status, and total amount',
  })
  async getInvoiceStats(@Req() req) {
    const userId = req.user.userId;
    const stats = await this.dashboardService.getInvoiceStats(userId);

    return {
      message: 'Invoice statistics retrieved successfully',
      data: stats,
      status: true,
    };
  }

  /**
   * Get recent activities
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('activities/recent')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get recent activities across all modules',
    description:
      'Returns recent activities from leads, invoices, expenses, inventory, and sales officers',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of activities to return (default: 10)',
  })
  async getRecentActivities(@Req() req, @Query('limit') limit?: string) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    const activities = await this.dashboardService.getRecentActivities(
      userId,
      limitNum,
    );

    return {
      message: 'Recent activities retrieved successfully',
      data: activities,
      status: true,
    };
  }

  /**
   * Get lead status distribution
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('leads/distribution')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get lead status distribution',
    description:
      'Returns count of leads by status (pending, in_progress, completed)',
  })
  async getLeadStatusDistribution(@Req() req) {
    const userId = req.user.userId;
    const distribution =
      await this.dashboardService.getLeadStatusDistribution(userId);

    return {
      message: 'Lead status distribution retrieved successfully',
      data: distribution,
      status: true,
    };
  }

  /**
   * Get inventory summary
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('inventory/summary')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get inventory summary',
    description:
      'Returns inventory counts by area type, total area, and file type distribution',
  })
  async getInventorySummary(@Req() req) {
    const userId = req.user.userId;
    const summary = await this.dashboardService.getInventorySummary(userId);

    return {
      message: 'Inventory summary retrieved successfully',
      data: summary,
      status: true,
    };
  }

  /**
   * Get complete dashboard data (all stats in one call)
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('complete')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get complete dashboard data',
    description:
      'Returns all dashboard data in a single API call - includes stats, expenses, performance, invoices, activities, leads, and inventory',
  })
  async getCompleteDashboardData(@Req() req) {
    const userId = req.user.userId;
    const data = await this.dashboardService.getCompleteDashboardData(userId);

    return {
      message: 'Complete dashboard data retrieved successfully',
      data,
      status: true,
    };
  }

  /**
   * Get expense report data for PDF generation
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('expenses/report')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get expense report data for PDF generation',
    description:
      'Returns filtered expense data for a specific date range for report generation',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO format (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO format (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  async getExpenseReportData(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const userId = req.user.userId;

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Set time to start and end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const data = await this.dashboardService.getExpenseReportData(
      userId,
      start,
      end,
    );

    return {
      message: 'Expense report data retrieved successfully',
      data,
      status: true,
    };
  }

  /**
   * Get quick stats (lightweight endpoint for frequent updates)
   */
  @UseGuards(JwtCookieAuthGuard)
  @Get('quick-stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get quick dashboard stats (lightweight)',
    description:
      'Returns essential statistics for quick dashboard updates - pending actions, today expenses, active officers',
  })
  async getQuickStats(@Req() req) {
    const userId = req.user.userId;
    const stats = await this.dashboardService.getDashboardStats(userId);

    return {
      message: 'Quick stats retrieved successfully',
      data: {
        pendingInvoices: stats.pendingInvoices,
        todayExpenses: stats.todayExpenses,
        activeSalesOfficers: stats.activeSalesOfficers,
        completedLeads: stats.completedLeads,
      },
      status: true,
    };
  }
}
