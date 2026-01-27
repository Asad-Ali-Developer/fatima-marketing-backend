import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateInvoiceDto, UpdateInvoiceApprovalDto } from 'src/DTOs';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { Invoice, InvoiceDocument, InvoiceSchema } from 'src/schemas';
import { UserService } from './User.service';

@Injectable()
export class InvoiceService {
  private invoiceModel: Model<InvoiceDocument>;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.invoiceModel = connection.model<InvoiceDocument>(
      'Invoice',
      InvoiceSchema,
    );
  }

  async createInvoice(
    userId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceDocument> {
    if (
      !createInvoiceDto.customerName ||
      !createInvoiceDto.phoneNumber ||
      createInvoiceDto.amount == null
    ) {
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
        id: userFound.created_by?.id || '',
        email: userFound.created_by?.email || '',
        name: userFound.created_by?.name,
        admin_approval_status: 'pending',
        approved_at: null,
      },
    };

    console.log('Invoice Data to be saved: ', invoiceData);

    const invoice = new this.invoiceModel(invoiceData);

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
      query.$or = [{ customerName: regex }, { phoneNumber: { $regex: regex } }];
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
    updateDto: Partial<Invoice>,
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
}
