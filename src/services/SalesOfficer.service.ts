import 'dotenv/config';

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Model, PipelineStage } from 'mongoose';
import { DatabaseProvider } from '../provider';
import { SOLeadStatus } from '../DTOs';
import {
  InvoiceDocument,
  InvoiceSchema,
  SOLeadDocument,
  SOLeadSchema,
  User,
  UserDocument,
  UserSchema,
} from '../schemas';

@Injectable()
export class SalesOfficerService {
  private userModel: Model<UserDocument>;
  private invoiceModel: Model<InvoiceDocument>;
  private soLeadModel: Model<SOLeadDocument>;

  constructor(private databaseProvider: DatabaseProvider) {
    const connection = this.databaseProvider.getConnection();
    this.userModel =
      (connection.models[User.name] as Model<UserDocument>) ||
      connection.model<UserDocument>(User.name, UserSchema);

    this.invoiceModel =
      (connection.models['Invoice'] as Model<InvoiceDocument>) ||
      connection.model<InvoiceDocument>('Invoice', InvoiceSchema);

    this.soLeadModel =
      (connection.models['SOLead'] as Model<SOLeadDocument>) ||
      connection.model<SOLeadDocument>('SOLead', SOLeadSchema);
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
    const limitNum = Math.min(10, Math.max(1, limit));

    const admin = await this.getUserDetailsById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(admin.role?.role_type as string)) {
      throw new UnauthorizedException('User is not an admin or Super Admin');
    }

    const query = {
      'created_by.id': adminId,
      'role.role_type': { $in: ['sales_officer'] },
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

  async getSalesOfficerCountByAdmin(adminId: string): Promise<number> {
    const result = await this.invoiceModel
      .aggregate([
        { $match: { 'reported_to.id': adminId } },
        { $group: { _id: '$created_by.id' } },
        { $count: 'total' },
      ])
      .exec();

    return result.length > 0 ? result[0].total : 0;
  }

  // ─── NEW: DASHBOARD LEADS FOR SALES OFFICER ────────────────────────

  async getLeadsForSalesOfficer(
    soId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      status?: string;
      date?: string;
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
      'createdBy.id': soId,
    };

    if (filters.status && filters.status !== 'all') {
      if (!['pending', 'in_progress', 'completed'].includes(filters.status)) {
        throw new BadRequestException('Invalid lead status');
      }
      query.status = filters.status;
    }

    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.$or = [{ userName: regex }, { location: regex }];
      if (filters.searchTerm.match(/^\d+$/)) {
        query.$or.push({ phoneNumber: filters.searchTerm });
      }
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date');
      }
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      query.time = { $gte: start, $lte: end };
    }

    const total = await this.soLeadModel.countDocuments(query).exec();
    const data = await this.soLeadModel
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

  // ─── NEW: INVOICES FOR SALES OFFICER ───────────────────────────────

  async getInvoicesForSalesOfficer(
    soId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      status?: string;
      date?: string;
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
      'created_by.id': soId,
    };

    if (filters.status && filters.status !== 'all') {
      if (!['pending', 'received_so'].includes(filters.status)) {
        throw new BadRequestException('Invalid invoice status');
      }
      query.status = filters.status;
    }

    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.$or = [{ customerName: regex }, { location: regex }];
      if (filters.searchTerm.match(/^\d+$/)) {
        query.$or.push({ phoneNumber: filters.searchTerm });
      }
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date');
      }
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

  // ─── NEW: DASHBOARD SUMMARY STATS ───────────────────────────────────

  async getDashboardStats(soId: string) {
    // Leads stats
    const totalLeads = await this.soLeadModel
      .countDocuments({
        'createdBy.id': soId,
      })
      .exec();
    const completedLeads = await this.soLeadModel
      .countDocuments({
        'createdBy.id': soId,
        status: SOLeadStatus.COMPLETED,
      })
      .exec();

    // Invoices stats
    const invoices = await this.invoiceModel
      .find({ 'created_by.id': soId })
      .select('amount status')
      .exec();

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0,
    );
    const receivedAmount = invoices
      .filter((inv) => inv.status === 'received_so')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const conversionRate =
      totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    return {
      totalLeads,
      completedLeads,
      conversionRate,
      totalRevenue,
      receivedAmount,
      pendingAmount,
    };
  }
}
