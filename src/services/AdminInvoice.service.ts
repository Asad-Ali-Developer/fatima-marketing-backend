import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateAdminInvoiceDto, UpdateAdminInvoiceApprovalDto } from 'src/DTOs';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import {
  AdminInvoice,
  AdminInvoiceDocument,
  AdminInvoiceSchema,
} from 'src/schemas';
import { LeadService } from './Lead.service';
import { UserService } from './User.service';

@Injectable()
export class AdminInvoiceService {
  private adminInvoiceModel: Model<AdminInvoiceDocument>;
  private leadService: LeadService;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.adminInvoiceModel = connection.model<AdminInvoiceDocument>(
      'AdminInvoice',
      AdminInvoiceSchema,
    );
    this.leadService = new LeadService(this.databaseProvider, this.userService);
  }

  async createAdminInvoice(
    userId: string,
    createInvoiceDto: CreateAdminInvoiceDto,
  ): Promise<AdminInvoiceDocument> {
    console.log('USERID inside the service: ', userId);
    console.log('Invoice DTO: ', createInvoiceDto);

    if (!createInvoiceDto.customerName || createInvoiceDto.amount == null) {
      throw new BadRequestException('Missing required fields');
    }

    const userFound = await this.userService.getUserDetailsById(userId);

    if (!userFound) {
      throw new NotFoundException('User not found');
    }

    const invoiceData = {
      ...createInvoiceDto,
      date: new Date(createInvoiceDto.date),
      created_by: {
        id: userId,
        email: userFound.email,
        name: userFound.full_name,
      },
      reported_to: {
        id: userFound.created_by?.id || userFound._id.toString(), // Fallback to self if no creator
        email: userFound.created_by?.email || userFound.email,
        name: userFound.created_by?.name || userFound.full_name,
        admin_approval_status: 'pending',
        approved_at: null,
      },
    };

    const invoice = new this.adminInvoiceModel(invoiceData);
    console.log('Invoice before saving: ', invoice);
    await this.leadService.updateAdminInvoiceId(
      createInvoiceDto.lead_id as string,
      invoice._id.toString(),
    );
    return invoice.save();
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      status?: string;
      date?: string; // ISO string or YYYY-MM-DD
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = { 'created_by.id': userId };

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by name or phone
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { customerName: searchRegex },
        { phoneNumber: { $regex: searchRegex } },
        { invoice_number: { $regex: searchRegex } },
      ];
    }

    // Date filter (compare only date part)
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const total = await this.adminInvoiceModel.countDocuments(query).exec();
    const data = await this.adminInvoiceModel
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

  async findAllInvoicesOfSalesOfficerByUser(
    userId: string,
    filters: {
      searchTerm?: string;
      status?: string;
      timeRange?: 'lastWeek' | 'lastMonth' | 'last6Months' | 'lastYear';
      from?: string;
      to?: string;
    },
  ) {
    const query: any = { 'created_by.id': userId };

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by name or phone
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { customerName: searchRegex },
        { phoneNumber: { $regex: searchRegex } },
      ];
    }

    // Date range logic
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (filters.from || filters.to) {
      // Custom date range
      if (filters.from) startDate = new Date(filters.from);
      if (filters.to) {
        endDate = new Date(filters.to);
        endDate.setHours(23, 59, 59, 999); // include full end day
      }
    } else if (filters.timeRange) {
      const now = new Date();
      switch (filters.timeRange) {
        case 'lastWeek':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'lastMonth':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'last6Months':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case 'lastYear':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = undefined;
      }
      endDate = new Date(); // up to now
    }

    // Apply date filter if any
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const total = await this.adminInvoiceModel.countDocuments(query).exec();
    const data = await this.adminInvoiceModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data,
      total,
    };
  }

  async getAdminInvoicesReportedToAdmin(
    adminId: string,
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

    // Build query: invoices where reported_to.id matches adminId
    const query: any = { 'reported_to.id': adminId };

    // Apply optional filters
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { customerName: regex },
        { phoneNumber: { $regex: regex } },
        { invoice_number: { $regex: regex } },
      ];
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const total = await this.adminInvoiceModel.countDocuments(query).exec();
    const data = await this.adminInvoiceModel
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

  async updateAdminInvoiceApprovalStatus(
    invoiceId: string,
    adminId: string,
    updateDto: UpdateAdminInvoiceApprovalDto,
  ): Promise<AdminInvoiceDocument> {
    // Ensure invoice exists and belongs to this admin
    const invoice = await this.adminInvoiceModel.findOne({
      _id: invoiceId,
      'reported_to.id': adminId,
    });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found or not assigned to this admin',
      );
    }

    // Update only the approval status
    invoice.reported_to.admin_approval_status = updateDto.admin_approval_status;
    invoice.reported_to.approved_at =
      updateDto.admin_approval_status === 'approved' ? new Date() : null;

    return invoice.save();
  }

  async findByIdAndUser(
    invoiceId: string,
    userId: string,
  ): Promise<AdminInvoiceDocument> {
    const invoice = await this.adminInvoiceModel
      .findOne({
        _id: invoiceId,
        'created_by.id': userId,
      })
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async updateAdminInvoice(
    invoiceId: string,
    userId: string,
    updateDto: Partial<AdminInvoice>,
  ): Promise<AdminInvoiceDocument> {
    const invoice = await this.findByIdAndUser(invoiceId, userId);

    Object.assign(invoice, updateDto);
    if (updateDto.date) {
      invoice.date = new Date(updateDto.date);
    }

    return invoice.save();
  }

  async deleteAdminInvoice(invoiceId: string, userId: string): Promise<void> {
    const result = await this.adminInvoiceModel
      .deleteOne({
        _id: invoiceId,
        'created_by.id': userId,
      })
      .exec();

    const invoice = await this.adminInvoiceModel.findById(invoiceId).exec();
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Update any leads associated with this invoice ID
    if (invoice.generatedByLead?._id) {
      await this.leadService.updateAdminLeadWhenDeletingInvoice(
        invoice.generatedByLead._id,
        invoiceId,
      );
    }

    console.log('Invoice to be deleted: ', invoice);

    if (result.deletedCount === 0) {
      throw new NotFoundException('Invoice not found or unauthorized');
    }
  }

  async updateAdminInvoiceRemarks(
    invoiceId: string,
    userId: string,
    remarks: string | undefined,
  ): Promise<AdminInvoiceDocument> {
    const invoice = await this.findByIdAndUser(invoiceId, userId);

    invoice.remarks = remarks; // Can be null/undefined to clear it
    return invoice.save();
  }

  async getInvoicesBySalesOfficer(
    salesOfficerId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    // Build query to find invoices created by this sales officer
    const query: any = { 'created_by.id': salesOfficerId };

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by customer name, phone, or invoice number
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { customerName: searchRegex },
        { phoneNumber: { $regex: searchRegex } },
        { invoice_number: { $regex: searchRegex } },
      ];
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};

      if (filters.dateFrom) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        query.date.$gte = startDate;
      }

      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }

    const total = await this.adminInvoiceModel.countDocuments(query).exec();
    const data = await this.adminInvoiceModel
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
