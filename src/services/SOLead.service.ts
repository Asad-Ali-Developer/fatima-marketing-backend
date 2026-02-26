import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { SOCreateLeadDto, SOLeadStatus, SOUpdateLeadDto } from 'src/DTOs';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { SOLeadDocument, SOLeadSchema } from 'src/schemas';
import { UserService } from './User.service';

@Injectable()
export class SOLeadService {
  private leadModel: Model<SOLeadDocument>;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.leadModel = connection.model<SOLeadDocument>('SOLead', SOLeadSchema);
  }

  async createLead(
    adminId: string,
    soCreateLeadDto: SOCreateLeadDto,
  ): Promise<SOLeadDocument> {
    // Validate admin exists
    const admin = await this.userService.getUserDetailsById(adminId);
    if (!admin) {
      throw new NotFoundException('SO not found!');
    }

    const lead = new this.leadModel({
      ...soCreateLeadDto,
      invoice_id: '',
      time: new Date(soCreateLeadDto.time),
    });

    return lead.save();
  }

  async findAllLeads(
    page: number = 1,
    limit: number = 10,
    userId: string,
    filters: {
      searchTerm?: string;
      status?: string;
      date?: string;
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // ✅ Filter by createdBy.id
    if (userId) {
      query['createdBy.id'] = userId;
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by user name
    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.userName = regex;
    }

    // Date filter (on `time` field)
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      query.time = { $gte: start, $lte: end };
    }

    const total = await this.leadModel.countDocuments(query).exec();
    const data = await this.leadModel
      .find(query)
      .populate('createdBy', 'name email')
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

  async findAllLeadsForSO(
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

    const query: any = {};

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by user name
    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.userName = regex;
    }

    // Date filter (on `time` field)
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      query.time = { $gte: start, $lte: end };
    }

    const total = await this.leadModel.countDocuments(query).exec();
    const data = await this.leadModel
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

  async findLeadById(id: string): Promise<SOLeadDocument> {
    const lead = await this.leadModel
      .findById(id)
      .populate('createdBy', 'name email')
      .exec();

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async updateLead(
    id: string,
    updateDto: SOUpdateLeadDto,
  ): Promise<SOLeadDocument> {
    const lead = await this.findLeadById(id);

    Object.assign(lead, {
      ...updateDto,
      time: updateDto.time ? new Date(updateDto.time) : lead.time,
    });

    return lead.save();
  }

  async deleteLead(id: string): Promise<void> {
    const result = await this.leadModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Lead not found');
    }
  }

  async updateLeadRemarks(
    id: string,
    remarks: string | null,
  ): Promise<SOLeadDocument> {
    const lead = await this.findLeadById(id);
    lead.remarks = remarks || undefined;
    return lead.save();
  }

  async updateLeadStatus(
    id: string,
    status: SOLeadStatus,
  ): Promise<SOLeadDocument> {
    const lead = await this.findLeadById(id);
    lead.status = status;
    return lead.save();
  }

  async getSalesOfficers() {
    return this.userService.getSalesOfficers();
  }

  /**
   * Fetches all leads assigned to a specific sales officer.
   * Accessible only to 'admin' or 'super_admin'.
   */
  async getLeadsByOfficer(
    requestingUserId: string, // The user making the request (for auth)
    officerId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Validate requester is admin/super_admin
    const requester =
      await this.userService.getUserDetailsById(requestingUserId);
    if (!requester || !['sales_officer'].includes(requester.role?.role_type!)) {
      throw new UnauthorizedException('Only SO can view Self Created leads');
    }

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { 'assignedTo.id': officerId };

    const total = await this.leadModel.countDocuments(query).exec();
    const data = await this.leadModel
      .find(query)
      .populate('createdBy', 'name email')
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

  async getLeadsBySalesOfficer(
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

    // Build query to find leads created by this sales officer
    const query: any = { 'createdBy.id': salesOfficerId };

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Search by user name or phone
    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.$or = [{ userName: regex }, { phoneNumber: { $regex: regex } }];
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.time = {};

      if (filters.dateFrom) {
        const startDate = new Date(filters.dateFrom);
        startDate.setHours(0, 0, 0, 0);
        query.time.$gte = startDate;
      }

      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.time.$lte = endDate;
      }
    }

    const total = await this.leadModel.countDocuments(query).exec();
    const data = await this.leadModel
      .find(query)
      .populate('createdBy', 'full_name email')
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

  async updateInvoiceId(
    leadId: string,
    invoiceId: string,
  ): Promise<SOLeadDocument> {
    console.log(`Updating lead ${leadId} with invoice ID: ${invoiceId}`);

    if (!invoiceId || invoiceId.trim() === '') {
      throw new NotFoundException('Invoice ID is required');
    }

    const lead = await this.leadModel
      .findByIdAndUpdate(
        leadId,
        { invoice_id: invoiceId },
        { new: true, runValidators: true },
      )
      .exec();

    console.log(`Lead after update: ${JSON.stringify(lead)}`);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async updateLeadWhenDeletingInvoice(
    leadId: string,
    invoiceId: string,
  ): Promise<SOLeadDocument> {
    console.log(`Updating lead ${leadId} with invoice ID: ${invoiceId}`);

    if (!invoiceId || invoiceId.trim() === '') {
      throw new NotFoundException('Invoice ID is required');
    }

    const lead = await this.leadModel
      .findByIdAndUpdate(
        leadId,
        { invoice_id: "" },
        { new: true, runValidators: true },
      )
      .exec();

    console.log(`Lead after update: ${JSON.stringify(lead)}`);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }
}
