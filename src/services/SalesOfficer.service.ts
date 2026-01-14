import 'dotenv/config';

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { User, UserDocument, UserSchema } from 'src/schemas';

@Injectable()
export class SalesOfficerService {
  private userModel: Model<UserDocument>;
  constructor(private databaseProvider: DatabaseProvider) {
    const connection = this.databaseProvider.getConnection();
    this.userModel = connection.model<UserDocument>(User.name, UserSchema);
  }

  /**
   * Fetches paginated list of sales officers created by a specific admin.
   * @param adminId - ID of the admin
   * @param page - Page number (1-based)
   * @param limit - Items per page (max 100)
   * @returns Paginated result with metadata
   */
  async getSalesOfficerByAdmin(
    adminId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    // Validate inputs
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    // 1. Validate admin exists and is admin
    const admin = await this.getUserDetailsById(adminId);

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role?.role_type !== 'admin') {
      throw new UnauthorizedException('User is not an admin');
    }

    // 2. Build query
    const query = {
      'created_by.id': adminId,
      'role.role_type': { $in: ['sales_officer'] },
    };

    // 3. Get total count for pagination metadata
    const total = await this.userModel.countDocuments(query).exec();

    // 4. Calculate pagination values
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;

    // 5. Fetch paginated data
    const data = await this.userModel
      .find(query)
      //   .select('-password')
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
    // console.log('User:', user);
    const foundUser = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    return foundUser;
  }
}
