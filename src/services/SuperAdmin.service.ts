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
export class SuperAdminService {
  private userModel: Model<UserDocument>;
  constructor(private databaseProvider: DatabaseProvider) {
    const connection = this.databaseProvider.getConnection();
    this.userModel = connection.model<UserDocument>(User.name, UserSchema);
  }

  /**
   * Fetches paginated list of admins/sales officers created by a specific super admin.
   * @param superAdminId - ID of the super admin
   * @param page - Page number (1-based)
   * @param limit - Items per page (max 100)
   * @returns Paginated result with metadata
   */
  async getAdminsBySuperAdmin(
    superAdminId: string,
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

    // 1. Validate super admin exists and is super_admin
    const superAdmin = await this.getUserDetailsById(superAdminId);

    if (!superAdmin) {
      throw new NotFoundException('Super admin not found');
    }

    if (superAdmin.role?.role_type !== 'super_admin') {
      throw new UnauthorizedException('User is not a super admin');
    }

    // 2. Build query
    const query = {
      'created_by.id': superAdminId,
      'role.role_type': { $in: ['admin'] },
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
