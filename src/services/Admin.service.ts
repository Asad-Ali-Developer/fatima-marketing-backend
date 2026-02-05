import 'dotenv/config';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import {
  User,
  UserSchema,
  UserDocument,
  InvoiceSchema,
  InvoiceDocument,
} from 'src/schemas';
import {
  subYears,
  endOfDay,
  endOfWeek,
  subMonths,
  endOfMonth,
  startOfDay,
  startOfWeek,
  startOfMonth,
} from 'date-fns';
import { PipelineStage } from 'mongoose';

@Injectable()
export class AdminService {
  private userModel: Model<UserDocument>;
  private invoiceModel: Model<InvoiceDocument>;

  constructor(private databaseProvider: DatabaseProvider) {
    const connection = this.databaseProvider.getConnection();
    this.userModel = connection.model<UserDocument>(User.name, UserSchema);
    this.invoiceModel = connection.model<InvoiceDocument>(
      'Invoice',
      InvoiceSchema,
    );
  }

  /**
   * Fetches paginated list of sales officers created by a specific admin.
   */
  async getSalesOfficerByAdmin(
    adminId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));

    const admin = await this.getUserDetailsById(adminId);
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(admin.role?.role_type!)) {
      throw new UnauthorizedException('User is not an admin');
    }

    const query = {
      'created_by.id': adminId,
      'role.role_type': 'sales_officer',
    };

    const total = await this.userModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;

    const data = await this.userModel
      .find(query)
      .select('-password')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return {
      data,
      total,
      page: pageNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    };
  }

  /**
   * Search sales officers by name or email (case-insensitive)
   */
  async searchSalesOfficers(adminId: string, searchTerm: string) {
    const admin = await this.getUserDetailsById(adminId);
    if (!admin || admin.role?.role_type !== 'admin') {
      throw new UnauthorizedException('User is not an admin');
    }

    const regex = new RegExp(searchTerm, 'i');
    const query = {
      'created_by.id': adminId,
      'role.role_type': 'sales_officer',
      $or: [{ full_name: regex }, { email: regex }],
    };

    const results = await this.userModel
      .find(query)
      .select('-password')
      .limit(10) // Prevent overload
      .exec();

    return results;
  }

  /**
   * Get a specific sales officer by ID (must be created by this admin)
   */
  async getSalesOfficerById(adminId: string, salesOfficerId: string) {
    const admin = await this.getUserDetailsById(adminId);
    if (!admin || admin.role?.role_type !== 'admin') {
      throw new UnauthorizedException('User is not an admin');
    }

    const so = await this.userModel
      .findOne({
        _id: salesOfficerId,
        'created_by.id': adminId,
        'role.role_type': 'sales_officer',
      })
      .select('-password')
      .exec();

    if (!so) {
      throw new NotFoundException('Sales officer not found or access denied');
    }

    return so;
  }

  public async getUserDetailsById(userId: string) {
    const foundUser = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    return foundUser;
  }

  /**
   * Get high-level dashboard stats for an admin
   */
  async getAdminDashboardStats(adminId: string) {
    const now = new Date();

    const countInDateRange = async (startDate: Date, endDate: Date) => {
      return this.invoiceModel
        .countDocuments({
          'reported_to.id': adminId,
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .exec();
    };

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const sixMonthsAgo = subMonths(now, 6);
    const oneYearAgo = subYears(now, 1);

    const [
      today,
      thisWeek,
      thisMonth,
      last6Months,
      thisYear,
      totalSalesOfficers,
      approved,
      rejected,
      pending,
    ] = await Promise.all([
      countInDateRange(todayStart, todayEnd),
      countInDateRange(weekStart, weekEnd),
      countInDateRange(monthStart, monthEnd),
      countInDateRange(sixMonthsAgo, now),
      countInDateRange(oneYearAgo, now),
      this.getSalesOfficerCountByAdmin(adminId),
      this.invoiceModel
        .countDocuments({
          'reported_to.id': adminId,
          'reported_to.admin_approval_status': 'approved',
        })
        .exec(),
      this.invoiceModel
        .countDocuments({
          'reported_to.id': adminId,
          'reported_to.admin_approval_status': 'rejected',
        })
        .exec(),
      this.invoiceModel
        .countDocuments({
          'reported_to.id': adminId,
          'reported_to.admin_approval_status': 'pending',
        })
        .exec(),
    ]);

    return {
      totalSalesOfficers,
      invoices: {
        today,
        thisWeek,
        thisMonth,
        last6Months,
        thisYear,
      },
      approvalStatus: {
        approved,
        rejected,
        pending,
      },
    };
  }

  /**
   * Get daily invoice trend for last N days
   */
  async getDailyInvoiceTrend(adminId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          'reported_to.id': adminId,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 as const },
      },
    ];

    const result = await this.invoiceModel.aggregate(pipeline).exec();

    const dateMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dateMap.set(key, 0);
    }

    result.forEach((item) => {
      if (typeof item._id === 'string') {
        dateMap.set(item._id, item.count);
      }
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /**
   * Get top sales officers by invoice count
   */
  async getInvoicesBySalesOfficer(adminId: string, limit: number = 5) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          'reported_to.id': adminId,
        },
      },
      {
        $group: {
          _id: '$created_by.id',
          name: { $first: '$created_by.name' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ];

    return this.invoiceModel.aggregate(pipeline).exec();
  }

  /**
   * Helper: Count distinct sales officers who created invoices
   */
  private async getSalesOfficerCountByAdmin(adminId: string): Promise<number> {
    const result = await this.invoiceModel
      .aggregate([
        { $match: { 'reported_to.id': adminId } },
        { $group: { _id: '$created_by.id' } },
        { $count: 'total' },
      ])
      .exec();

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Get a specific sales officer created by this admin
   */
  // async getSalesOfficerById(adminId: string, salesOfficerId: string) {
  //   const so = await this.userModel.findOne({
  //     _id: salesOfficerId,
  //     'created_by.id': adminId,
  //     'role.role_type': 'sales_officer',
  //   }).select('-password').exec();

  //   if (!so) {
  //     throw new NotFoundException('Sales officer not found or access denied');
  //   }
  //   return so;
  // }

  /**
   * Get paginated invoices created by a specific SO and reported to this admin
   */
  async getInvoicesBySalesOfficerId(
    adminId: string,
    salesOfficerId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      status?: string;
      date?: string; // YYYY-MM-DD
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    // Build base query
    const query: any = {
      'reported_to.id': adminId,
      'created_by.id': salesOfficerId,
    };

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by customer name or phone
    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.$or = [{ customerName: regex }, { phoneNumber: { $regex: regex } }];
    }

    // Date filter
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const total = await this.invoiceModel.countDocuments(query).exec();
    const data = await this.invoiceModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    const totalPages = Math.ceil(total / limitNum);

    return {
      data,
      total,
      page: pageNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    };
  }
}
