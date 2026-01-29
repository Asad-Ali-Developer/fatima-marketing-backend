import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseProvider } from '../provider/DatabaseProvider';
import { UserService } from './User.service';
import {
  ExpenseDocument,
  ExpenseSchema,
  InventoryDocument,
  InventorySchema,
  InvoiceDocument,
  InvoiceSchema,
  LeadDocument,
  leadSchema,
  UserDocument,
  UserSchema,
} from 'src/schemas';

interface DashboardStats {
  totalSalesOfficers: number;
  activeSalesOfficers: number;
  totalLeads: number;
  totalInvoices: number;
  totalInventory: number;
  pendingInvoices: number;
  completedLeads: number;
  todayExpenses: number;
  totalExpenses: number;
}

interface ExpenseSummary {
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  thisMonth: number;
  lastMonth: number;
}

interface ExpenseTrend {
  current: number;
  previous: number;
  percentage: number;
  isPositive: boolean;
}

interface OfficerPerformance {
  officer: {
    _id: string;
    full_name: string;
    email: string;
    status: string;
  };
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
  };
  completionRate: number;
}

// At the very end of src/services/Dashboard.service.ts

export type {
  DashboardStats,
  ExpenseSummary,
  ExpenseTrend,
  OfficerPerformance,
  InvoiceStats,
  RecentActivity,
};

interface InvoiceStats {
  pending: number;
  received: number;
  cancelled: number;
  totalAmount: number;
  approvalStats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'lead' | 'invoice' | 'expense' | 'inventory' | 'sales_officer';
  title: string;
  subtitle: string;
  time: Date;
  metadata?: any;
}

@Injectable()
export class DashboardService {
  private expenseModel: Model<ExpenseDocument>;
  private inventoryModel: Model<InventoryDocument>;
  private invoiceModel: Model<InvoiceDocument>;
  private leadModel: Model<LeadDocument>;
  private userModel: Model<UserDocument>;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.expenseModel = connection.model<ExpenseDocument>(
      'Expense',
      ExpenseSchema,
    );
    this.inventoryModel = connection.model<InventoryDocument>(
      'Inventory',
      InventorySchema,
    );
    this.invoiceModel = connection.model<InvoiceDocument>(
      'Invoice',
      InvoiceSchema,
    );
    this.leadModel = connection.model<LeadDocument>('Lead', leadSchema);
    this.userModel = connection.model<UserDocument>('User', UserSchema);
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallel queries for better performance
    const [
      totalSalesOfficers,
      activeSalesOfficers,
      totalLeads,
      completedLeads,
      totalInvoices,
      pendingInvoices,
      totalInventory,
      todayExpenses,
      allExpenses,
    ] = await Promise.all([
      // Sales Officers
      this.userModel.countDocuments({
        'role.role_type': 'sales_officer',
      }),
      this.userModel.countDocuments({
        'role.role_type': 'sales_officer',
        status: 'active',
      }),
      // Leads
      this.leadModel.countDocuments(),
      this.leadModel.countDocuments({ status: 'completed' }),
      // Invoices
      this.invoiceModel.countDocuments(),
      this.invoiceModel.countDocuments({ status: 'pending' }),
      // Inventory
      this.inventoryModel.countDocuments(),
      // Today's Expenses
      this.expenseModel.find({ createdAt: { $gte: today } }),
      // All Expenses
      this.expenseModel.find(),
    ]);

    const todayExpensesTotal = todayExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const totalExpensesAmount = allExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    return {
      totalSalesOfficers,
      activeSalesOfficers,
      totalLeads,
      totalInvoices,
      totalInventory,
      pendingInvoices,
      completedLeads,
      todayExpenses: todayExpensesTotal,
      totalExpenses: totalExpensesAmount,
    };
  }

  /**
   * Get expense summary with different time periods
   */
  async getExpenseSummary(userId: string): Promise<ExpenseSummary> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const now = new Date();

    // Today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Yesterday
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Last 7 days
    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 7);
    last7Start.setHours(0, 0, 0, 0);

    // Last 30 days
    const last30Start = new Date(now);
    last30Start.setDate(last30Start.getDate() - 30);
    last30Start.setHours(0, 0, 0, 0);

    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [
      todayExpenses,
      yesterdayExpenses,
      last7Expenses,
      last30Expenses,
      thisMonthExpenses,
      lastMonthExpenses,
    ] = await Promise.all([
      this.expenseModel.find({ createdAt: { $gte: todayStart } }),
      this.expenseModel.find({
        createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      }),
      this.expenseModel.find({ createdAt: { $gte: last7Start } }),
      this.expenseModel.find({ createdAt: { $gte: last30Start } }),
      this.expenseModel.find({ createdAt: { $gte: thisMonthStart } }),
      this.expenseModel.find({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),
    ]);

    const sumExpenses = (expenses: ExpenseDocument[]) =>
      expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      today: sumExpenses(todayExpenses),
      yesterday: sumExpenses(yesterdayExpenses),
      last7: sumExpenses(last7Expenses),
      last30: sumExpenses(last30Expenses),
      thisMonth: sumExpenses(thisMonthExpenses),
      lastMonth: sumExpenses(lastMonthExpenses),
    };
  }

  /**
   * Get expense trends (week over week comparison)
   */
  async getExpenseTrends(userId: string): Promise<ExpenseTrend> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const now = new Date();

    // Current week
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Previous week
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setSeconds(previousWeekEnd.getSeconds() - 1);

    const [currentWeekExpenses, previousWeekExpenses] = await Promise.all([
      this.expenseModel.find({ createdAt: { $gte: currentWeekStart } }),
      this.expenseModel.find({
        createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd },
      }),
    ]);

    const current = currentWeekExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const previous = previousWeekExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    const percentage =
      previous > 0 ? Math.abs(((current - previous) / previous) * 100) : 0;
    const isPositive = current < previous; // Lower expenses = positive

    return {
      current,
      previous,
      percentage: Number(percentage.toFixed(2)),
      isPositive,
    };
  }

  /**
   * Get sales officers performance with lead statistics
   */
  async getOfficersPerformance(userId: string): Promise<OfficerPerformance[]> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    // Get all sales officers
    const salesOfficers = await this.userModel
      .find({ 'role.role_type': 'sales_officer' })
      .select('_id full_name email status')
      .lean();

    // Get lead stats for each officer
    const performanceData = await Promise.all(
      salesOfficers.map(async (officer) => {
        const leads = await this.leadModel
          .find({ 'assignedTo.id': officer._id.toString() })
          .lean();

        const stats = {
          pending: 0,
          in_progress: 0,
          completed: 0,
          total: leads.length,
        };

        leads.forEach((lead) => {
          if (lead.status === 'pending') stats.pending++;
          else if (lead.status === 'in_progress') stats.in_progress++;
          else if (lead.status === 'completed') stats.completed++;
        });

        const completionRate =
          stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

        return {
          officer: {
            _id: officer._id.toString(),
            full_name: officer.full_name,
            email: officer.email,
            status: officer.status || 'active',
          },
          stats,
          completionRate: Number(completionRate.toFixed(2)),
        };
      }),
    );

    // Sort by total leads (descending)
    return performanceData.sort((a, b) => b.stats.total - a.stats.total);
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(userId: string): Promise<InvoiceStats> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const invoices = await this.invoiceModel.find().lean();

    const stats: InvoiceStats = {
      pending: 0,
      received: 0,
      cancelled: 0,
      totalAmount: 0,
      approvalStats: {
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    };

    invoices.forEach((invoice) => {
      // Status counts
      if (invoice.status === 'pending') stats.pending++;
      else if (invoice.status === 'received_so') stats.received++;
      else if (invoice.status === 'cancelled') stats.cancelled++;

      // Total amount
      stats.totalAmount += invoice.amount || 0;

      // Approval status counts
      if (invoice.reported_to?.admin_approval_status === 'pending')
        stats.approvalStats.pending++;
      else if (invoice.reported_to?.admin_approval_status === 'approved')
        stats.approvalStats.approved++;
      else if (invoice.reported_to?.admin_approval_status === 'rejected')
        stats.approvalStats.rejected++;
    });

    return stats;
  }

  /**
   * Get recent activities across all modules
   */
  async getRecentActivities(
    userId: string,
    limit: number = 10,
  ): Promise<RecentActivity[]> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const activities: RecentActivity[] = [];

    // Recent Leads
    const recentLeads = await this.leadModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentLeads.forEach((lead) => {
      activities.push({
        id: lead._id.toString(),
        type: 'lead',
        title: `New lead: ${lead.userName}`,
        subtitle: `Assigned to ${lead.assignedTo.full_name} • ${lead.status}`,
        time: lead.createdAt,
        metadata: {
          leadId: lead._id,
          status: lead.status,
          assignedTo: lead.assignedTo.full_name,
        },
      });
    });

    // Recent Invoices
    const recentInvoices = await this.invoiceModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentInvoices.forEach((invoice) => {
      const statusText =
        invoice.status === 'pending'
          ? 'Pending'
          : invoice.status === 'received_so'
            ? 'Received'
            : 'Cancelled';

      activities.push({
        id: invoice._id.toString(),
        type: 'invoice',
        title: `Invoice ${statusText}: ${invoice.customerName}`,
        subtitle: `Rs. ${invoice.amount?.toLocaleString() || 0} • ${invoice.reported_to?.admin_approval_status || 'pending'}`,
        time: invoice.createdAt!,
        metadata: {
          invoiceId: invoice._id,
          status: invoice.status,
          amount: invoice.amount,
          approvalStatus: invoice.reported_to?.admin_approval_status,
        },
      });
    });

    // Recent Expenses
    const recentExpenses = await this.expenseModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentExpenses.forEach((expense) => {
      activities.push({
        id: expense._id.toString(),
        type: 'expense',
        title: `Expense: ${expense.name}`,
        subtitle: `Rs. ${expense.amount.toLocaleString()} • ${expense.created_by.name}`,
        time: expense.createdAt!,
        metadata: {
          expenseId: expense._id,
          amount: expense.amount,
          createdBy: expense.created_by.name,
        },
      });
    });

    // Recent Inventory
    const recentInventory = await this.inventoryModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentInventory.forEach((item) => {
      activities.push({
        id: item._id.toString(),
        type: 'inventory',
        title: `Inventory added: ${item.registrationNumber}`,
        subtitle: `${item.areaSize} ${item.areaType} • ${item.fileType}`,
        time: item.createdAt!,
        metadata: {
          inventoryId: item._id,
          registrationNumber: item.registrationNumber,
          areaSize: item.areaSize,
          areaType: item.areaType,
        },
      });
    });

    // Recent Sales Officers
    const recentSalesOfficers = await this.userModel
      .find({ 'role.role_type': 'sales_officer' })
      .sort({ created_at: -1 })
      .limit(3)
      .lean();

    recentSalesOfficers.forEach((officer) => {
      activities.push({
        id: officer._id.toString(),
        type: 'sales_officer',
        title: `New sales officer: ${officer.full_name}`,
        subtitle: `${officer.email} • ${officer.status || 'active'}`,
        time: officer.createdAt!,
        metadata: {
          officerId: officer._id,
          email: officer.email,
          status: officer.status,
        },
      });
    });

    // Sort all activities by time (most recent first) and limit
    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);
  }

  /**
   * Get lead status distribution
   */
  async getLeadStatusDistribution(userId: string) {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const leads = await this.leadModel.find().lean();

    const distribution = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      total: leads.length,
    };

    leads.forEach((lead) => {
      if (lead.status === 'pending') distribution.pending++;
      else if (lead.status === 'in_progress') distribution.in_progress++;
      else if (lead.status === 'completed') distribution.completed++;
    });

    return distribution;
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(userId: string) {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const inventoryItems = await this.inventoryModel.find().lean();

    const summary = {
      total: inventoryItems.length,
      byAreaType: {
        Kanal: 0,
        Marla: 0,
      },
      totalArea: {
        Kanal: 0,
        Marla: 0,
      },
      byFileType: {} as Record<string, number>,
    };

    inventoryItems.forEach((item) => {
      // Count by area type
      if (item.areaType === 'Kanal') {
        summary.byAreaType.Kanal++;
        summary.totalArea.Kanal += item.areaSize;
      } else if (item.areaType === 'Marla') {
        summary.byAreaType.Marla++;
        summary.totalArea.Marla += item.areaSize;
      }

      // Count by file type
      if (!summary.byFileType[item.fileType]) {
        summary.byFileType[item.fileType] = 0;
      }
      summary.byFileType[item.fileType]++;
    });

    return summary;
  }

  /**
   * Get comprehensive dashboard data (all stats in one call)
   */
  async getCompleteDashboardData(userId: string) {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const [
      dashboardStats,
      expenseSummary,
      expenseTrends,
      officersPerformance,
      invoiceStats,
      recentActivities,
      leadStatusDistribution,
      inventorySummary,
    ] = await Promise.all([
      this.getDashboardStats(userId),
      this.getExpenseSummary(userId),
      this.getExpenseTrends(userId),
      this.getOfficersPerformance(userId),
      this.getInvoiceStats(userId),
      this.getRecentActivities(userId, 10),
      this.getLeadStatusDistribution(userId),
      this.getInventorySummary(userId),
    ]);

    return {
      dashboardStats,
      expenseSummary,
      expenseTrends,
      officersPerformance,
      invoiceStats,
      recentActivities,
      leadStatusDistribution,
      inventorySummary,
    };
  }

  /**
   * Get expense report data for PDF generation
   */
  async getExpenseReportData(userId: string, startDate: Date, endDate: Date) {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user || user.role?.role_type !== 'super_admin') {
      throw new NotFoundException('Unauthorized access');
    }

    const expenses = await this.expenseModel
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      expenses,
      totalAmount,
      count: expenses.length,
      period: {
        startDate,
        endDate,
      },
    };
  }
}

