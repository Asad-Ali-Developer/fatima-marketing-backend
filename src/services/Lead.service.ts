import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateLeadDto, LeadStatus, UpdateLeadDto } from 'src/DTOs';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import {
  User,
  leadSchema,
  UserSchema,
  UserDocument,
  LeadDocument,
} from 'src/schemas';
import { UserService } from './User.service';

@Injectable()
export class LeadService {
  private leadModel: Model<LeadDocument>;
  private userModel: Model<UserDocument>;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.leadModel = connection.model<LeadDocument>('Lead', leadSchema);
    this.userModel = connection.model<UserDocument>(User.name, UserSchema);
  }

  async createLead(
    adminId: string,
    createLeadDto: CreateLeadDto,
  ): Promise<LeadDocument> {
    // Validate admin exists
    const admin = await this.userService.getUserDetailsById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const lead = new this.leadModel({
      ...createLeadDto,
      time: new Date(createLeadDto.time),
    });

    return lead.save();
  }

  /**
   * Fetches paginated list of sales officers created by a specific admin.
   * Accessible to both 'admin' and 'super_admin'.
   */
  async getSalesOfficersByAdmin(
    adminId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));

    const admin = await this.userService.getUserDetailsById(adminId);
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
   * Fetches ALL sales officers created by a specific admin (no pagination).
   * Intended for internal use (e.g., dropdowns, reports).
   * Only accessible to 'admin' or 'super_admin'.
   */
  async getAllSalesOfficersByAdmin(adminId: string) {
    const admin = await this.userService.getUserDetailsById(adminId);
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(admin.role?.role_type!)) {
      throw new UnauthorizedException(
        'User is not authorized to view sales officers',
      );
    }

    const query = {
      'created_by.id': adminId,
      'role.role_type': 'sales_officer',
    };

    const data = await this.userModel
      .find(query)
      .select('-password')
      .sort({ created_at: -1 })
      .exec();

    return data; // Returns array of UserDocument[]
  }

  async findAllLeads(
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
      .populate('assignedTo', 'name email')
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
      assignedToId?: string; // ✅ Add this
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // ✅ Filter by assignedTo.id
    if (filters.assignedToId) {
      query['assignedTo.id'] = filters.assignedToId;
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

  async findLeadById(id: string): Promise<LeadDocument> {
    const lead = await this.leadModel
      .findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async updateLead(
    id: string,
    updateDto: UpdateLeadDto,
  ): Promise<LeadDocument> {
    const lead = await this.findLeadById(id);

    // Validate new assigned sales officer
    if (
      updateDto.assignedTo &&
      updateDto.assignedTo.id !== lead.assignedTo.id.toString()
    ) {
      const salesOfficer = await this.userService.getUserDetailsById(
        updateDto.assignedTo.id,
      );
      if (!salesOfficer) {
        throw new BadRequestException('Assigned sales officer not found');
      }
    }

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
  ): Promise<LeadDocument> {
    const lead = await this.findLeadById(id);
    lead.remarks = remarks || undefined;
    return lead.save();
  }

  async updateLeadStatus(
    id: string,
    status: LeadStatus,
  ): Promise<LeadDocument> {
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
    if (
      !requester ||
      !['admin', 'super_admin'].includes(requester.role?.role_type!)
    ) {
      throw new UnauthorizedException('Only admins can view officer leads');
    }

    // Validate officer exists and is a sales officer
    const officer = await this.userService.getUserDetailsById(officerId);
    if (!officer || officer.role?.role_type !== 'sales_officer') {
      throw new NotFoundException('Sales officer not found');
    }

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { 'assignedTo.id': officerId };

    const total = await this.leadModel.countDocuments(query).exec();
    const data = await this.leadModel
      .find(query)
      .populate('assignedTo', 'name email')
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
}
