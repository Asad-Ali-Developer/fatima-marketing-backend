import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { SOLeadService } from './SOLead.service';
import { UserService } from './User.service';
import { InvoiceDocument, typedInvoiceSchema } from '../schemas';
import {
  CreateInvoiceDto,
  UpdateInvoiceApprovalDto,
  UpdateInvoiceDto,
} from '../DTOs';
import { DatabaseProvider } from '../provider';

@Injectable()
export class InvoiceService {
  private invoiceModel: Model<InvoiceDocument>;
  private soLeadService: SOLeadService;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.invoiceModel = connection.model<InvoiceDocument>(
      'Invoice',
      typedInvoiceSchema,
    );
    this.soLeadService = new SOLeadService(
      this.databaseProvider,
      this.userService,
    );
  }

  async createInvoice(
    userId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceDocument> {
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

    const invoice = new this.invoiceModel(invoiceData);
    console.log('Invoice before saving: ', invoice);
    await this.soLeadService.updateInvoiceId(
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

    const total = await this.invoiceModel.countDocuments(query).exec();
    const data = await this.invoiceModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    return {
      data,
      total,
    };
  }

  async getInvoicesReportedToAdmin(
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

  async updateInvoiceApprovalStatus(
    invoiceId: string,
    adminId: string,
    updateDto: UpdateInvoiceApprovalDto,
  ): Promise<InvoiceDocument> {
    // Ensure invoice exists and belongs to this admin
    const invoice = await this.invoiceModel.findOne({
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
  ): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel
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

  async updateInvoice(
    invoiceId: string,
    userId: string,
    updateDto: Partial<UpdateInvoiceDto>,
  ): Promise<InvoiceDocument> {
    const invoice = await this.findByIdAndUser(invoiceId, userId);

    Object.assign(invoice, updateDto);
    if (updateDto.date) {
      invoice.date = new Date(updateDto.date);
    }

    return invoice.save();
  }

  async deleteInvoice(invoiceId: string, userId: string): Promise<void> {
    const result = await this.invoiceModel
      .deleteOne({
        _id: invoiceId,
        'created_by.id': userId,
      })
      .exec();

    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Update any leads associated with this invoice ID
    if (invoice.generatedByLead?._id) {
      await this.soLeadService.updateLeadWhenDeletingInvoice(
        invoice.generatedByLead._id,
        invoiceId,
      );
    }

    console.log('Invoice to be deleted: ', invoice);

    if (result.deletedCount === 0) {
      throw new NotFoundException('Invoice not found or unauthorized');
    }
  }

  async updateInvoiceRemarks(
    invoiceId: string,
    userId: string,
    remarks: string | undefined,
  ): Promise<InvoiceDocument> {
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
