import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsInt,
    IsOptional,
    Max,
    Min
} from 'class-validator';

/**
 * Query DTO for expense report generation
 */
export class ExpenseReportQueryDto {
  @ApiProperty({
    description: 'Start date in ISO format',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date in ISO format',
    example: '2024-01-31',
  })
  @IsDateString()
  endDate: string;
}

/**
 * Query DTO for recent activities
 */
export class RecentActivitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Number of activities to return',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Response DTO for Dashboard Stats
 */
export class DashboardStatsResponseDto {
  @ApiProperty()
  totalSalesOfficers: number;

  @ApiProperty()
  activeSalesOfficers: number;

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  totalInvoices: number;

  @ApiProperty()
  totalInventory: number;

  @ApiProperty()
  pendingInvoices: number;

  @ApiProperty()
  completedLeads: number;

  @ApiProperty()
  todayExpenses: number;

  @ApiProperty()
  totalExpenses: number;
}

/**
 * Response DTO for Expense Summary
 */
export class ExpenseSummaryResponseDto {
  @ApiProperty()
  today: number;

  @ApiProperty()
  yesterday: number;

  @ApiProperty()
  last7: number;

  @ApiProperty()
  last30: number;

  @ApiProperty()
  thisMonth: number;

  @ApiProperty()
  lastMonth: number;
}

/**
 * Response DTO for Expense Trends
 */
export class ExpenseTrendResponseDto {
  @ApiProperty()
  current: number;

  @ApiProperty()
  previous: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  isPositive: boolean;
}

/**
 * Response DTO for Officer Stats
 */
export class OfficerStatsDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  in_progress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  total: number;
}

/**
 * Response DTO for Officer Info
 */
export class OfficerInfoDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  status: string;
}

/**
 * Response DTO for Officer Performance
 */
export class OfficerPerformanceResponseDto {
  @ApiProperty({ type: OfficerInfoDto })
  officer: OfficerInfoDto;

  @ApiProperty({ type: OfficerStatsDto })
  stats: OfficerStatsDto;

  @ApiProperty()
  completionRate: number;
}

/**
 * Response DTO for Invoice Stats
 */
export class InvoiceStatsResponseDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  received: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({
    type: 'object',
    properties: {
      pending: { type: 'number' },
      approved: { type: 'number' },
      rejected: { type: 'number' },
    },
  })
  approvalStats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

/**
 * Response DTO for Recent Activity
 */
export class RecentActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    enum: ['lead', 'invoice', 'expense', 'inventory', 'sales_officer'],
  })
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subtitle: string;

  @ApiProperty()
  time: Date;

  @ApiPropertyOptional()
  metadata?: any;
}

/**
 * Response DTO for Lead Status Distribution
 */
export class LeadStatusDistributionResponseDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  in_progress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  total: number;
}

/**
 * Response DTO for Inventory Summary
 */
export class InventorySummaryResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty({
    type: 'object',
    properties: {
      Kanal: { type: 'number' },
      Marla: { type: 'number' },
    },
  })
  byAreaType: {
    Kanal: number;
    Marla: number;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      Kanal: { type: 'number' },
      Marla: { type: 'number' },
    },
  })
  totalArea: {
    Kanal: number;
    Marla: number;
  };

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  byFileType: Record<string, number>;
}

/**
 * Response DTO for Complete Dashboard Data
 */
export class CompleteDashboardDataResponseDto {
  @ApiProperty({ type: DashboardStatsResponseDto })
  dashboardStats: DashboardStatsResponseDto;

  @ApiProperty({ type: ExpenseSummaryResponseDto })
  expenseSummary: ExpenseSummaryResponseDto;

  @ApiProperty({ type: ExpenseTrendResponseDto })
  expenseTrends: ExpenseTrendResponseDto;

  @ApiProperty({ type: [OfficerPerformanceResponseDto] })
  officersPerformance: OfficerPerformanceResponseDto[];

  @ApiProperty({ type: InvoiceStatsResponseDto })
  invoiceStats: InvoiceStatsResponseDto;

  @ApiProperty({ type: [RecentActivityResponseDto] })
  recentActivities: RecentActivityResponseDto[];

  @ApiProperty({ type: LeadStatusDistributionResponseDto })
  leadStatusDistribution: LeadStatusDistributionResponseDto;

  @ApiProperty({ type: InventorySummaryResponseDto })
  inventorySummary: InventorySummaryResponseDto;
}

/**
 * Response DTO for Expense Report Data
 */
export class ExpenseReportDataResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  expenses: any[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  count: number;

  @ApiProperty({
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  })
  period: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Response DTO for Quick Stats
 */
export class QuickStatsResponseDto {
  @ApiProperty()
  pendingInvoices: number;

  @ApiProperty()
  todayExpenses: number;

  @ApiProperty()
  activeSalesOfficers: number;

  @ApiProperty()
  completedLeads: number;
}
