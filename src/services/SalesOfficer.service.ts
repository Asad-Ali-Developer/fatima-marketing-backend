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
  LeadDocument,
  leadSchema,
  SOLeadDocument,
  SOLeadSchema,
  User,
  UserDocument,
  UserSchema,
} from '../schemas';

export interface DayLeadCounts {
  date: string; // "YYYY-MM-DD"
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export interface SalesOfficerDashboardStats {
  totalLeads: number;
  pendingLeads: number;
  inProgressLeads: number;
  completedLeads: number;
  conversionRate: string;
  last7Days: DayLeadCounts[];
}

@Injectable()
export class SalesOfficerService {
  private userModel: Model<UserDocument>;
  private invoiceModel: Model<InvoiceDocument>;
  private soLeadModel: Model<SOLeadDocument>;
  private leadModal: Model<LeadDocument>;

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

    this.leadModal =
      (connection.models['Lead'] as Model<LeadDocument>) ||
      connection.model<LeadDocument>('Lead', leadSchema);
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

  async getAssignedLeadsForSalesOfficer(
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
      'assignedTo.id': soId,
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

    const total = await this.leadModal.countDocuments(query).exec();
    const data = await this.leadModal
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

  async getLeadStats(soId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const [facet] = await this.leadModal
      .aggregate([
        { $match: { 'assignedTo.id': soId } },
        {
          $facet: {
            // total counts per status (cheap: no documents returned, just group)
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            // per-day, per-status counts for the last 7 days only
            last7Days: [
              { $match: { time: { $gte: sevenDaysAgo } } },
              {
                $group: {
                  _id: {
                    day: {
                      $dateToString: { format: '%Y-%m-%d', date: '$time' },
                    },
                    status: '$status',
                  },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .exec();

    const statusMap: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
    };
    (facet?.statusCounts || []).forEach((s: any) => {
      if (s._id in statusMap) statusMap[s._id] = s.count;
    });

    const total =
      statusMap.pending + statusMap.in_progress + statusMap.completed;

    // Build a fixed 7-day series (Mon..Sun-relative, oldest -> newest) and
    // fill in zeros for days with no leads, so the frontend never has to guess.
    const days: {
      date: string;
      label: string;
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
      });
    }
    const dayIndex = new Map(days.map((d, idx) => [d.date, idx]));
    (facet?.last7Days || []).forEach((row: any) => {
      const idx = dayIndex.get(row._id.day);
      if (idx === undefined) return;
      days[idx].total += row.count;
      if (row._id.status === 'pending') days[idx].pending += row.count;
      if (row._id.status === 'in_progress') days[idx].inProgress += row.count;
      if (row._id.status === 'completed') days[idx].completed += row.count;
    });

    return {
      total,
      pending: statusMap.pending,
      inProgress: statusMap.in_progress,
      completed: statusMap.completed,
      conversionRate: total > 0 ? (statusMap.completed / total) * 100 : 0,
      last7Days: days,
    };
  }

  // ── 2. Today's assigned leads only (reuses your existing paginated method) ─
  async getTodayAssignedLeads(soId: string, page = 1, limit = 50) {
    const todayISO = new Date().toISOString().slice(0, 10);
    return this.getAssignedLeadsForSalesOfficer(soId, page, limit, {
      date: todayISO,
    });
  }

  // ── 3. Weekly calendar report — per-day counts for an arbitrary week ────
  async getLeadsCalendar(
    soId: string,
    startDate: string,
    endDate: string,
    status?: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const query: any = {
      'assignedTo.id': soId,
      time: { $gte: start, $lte: end },
    };
    if (status && status !== 'all') {
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        throw new BadRequestException('Invalid lead status');
      }
      query.status = status;
    }

    const rows = await this.leadModal
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$time' } },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    // Return a flat per-day map; the frontend fills in the 7 visible days.
    const byDay: Record<
      string,
      { total: number; pending: number; inProgress: number; completed: number }
    > = {};
    rows.forEach((row: any) => {
      const key = row._id.day;
      if (!byDay[key]) {
        byDay[key] = { total: 0, pending: 0, inProgress: 0, completed: 0 };
      }
      byDay[key].total += row.count;
      if (row._id.status === 'pending') byDay[key].pending += row.count;
      if (row._id.status === 'in_progress') byDay[key].inProgress += row.count;
      if (row._id.status === 'completed') byDay[key].completed += row.count;
    });

    return byDay;
  }

  // ── 4. Needs Attention — staleness computed server-side, filtered + limited ─
  async getNeedsAttentionLeads(
    soId: string,
    filters: {
      date?: string;
      range?: 'today' | '7d' | '30d';
      limit?: number;
    } = {},
  ) {
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));

    // ─────────────────────────────────────────────
    // Base query
    // ─────────────────────────────────────────────
    const query: Record<string, any> = {
      'assignedTo.id': soId,

      // Anything not completed is still remaining
      status: {
        $in: ['pending', 'in_progress'],
      },
    };

    // ─────────────────────────────────────────────
    // Date filter
    // ─────────────────────────────────────────────
    if (filters.date) {
      const targetDate = new Date(filters.date);

      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date');
      }

      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      query.time = {
        $gte: start,
        $lte: end,
      };
    } else if (filters.range) {
      const now = new Date();

      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      if (filters.range === 'today') {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        query.time = {
          $gte: start,
          $lte: end,
        };
      } else {
        const days = filters.range === '30d' ? 30 : 7;

        start.setDate(start.getDate() - (days - 1));

        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        query.time = {
          $gte: start,
          $lte: end,
        };
      }
    }

    // ─────────────────────────────────────────────
    // Fetch remaining leads
    // ─────────────────────────────────────────────
    const results = await this.leadModal
      .find(query)
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean()
      .exec();

    return results;
  }
}
