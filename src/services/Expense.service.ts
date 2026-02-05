import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateExpenseDto, UpdateExpenseDto } from 'src/DTOs';
import { ExpenseDocument, ExpenseSchema } from 'src/schemas';
import { DatabaseProvider } from '../provider/DatabaseProvider';
import { UserService } from './User.service';

@Injectable()
export class ExpenseService {
  private expenseModel: Model<ExpenseDocument>;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.expenseModel = connection.model<ExpenseDocument>(
      'Expense',
      ExpenseSchema,
    );
  }

  async createExpense(
    userId: string,
    createDto: CreateExpenseDto,
  ): Promise<ExpenseDocument> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expense = new this.expenseModel({
      ...createDto,
      created_by: {
        id: userId,
        email: user.email,
        name: user.full_name,
        role_type: user.role?.role_type,
      },
    });

    return expense.save();
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      dateFilter?: string; // "today", "yesterday", "last7", "last30"
      customDateRange?: { from?: Date; to?: Date }; // 👈 ADDED
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = { 'created_by.id': userId };

    // Search by name
    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.name = regex;
    }

    // 👇 UPDATED: Custom date range support
    if (filters.customDateRange?.from && filters.customDateRange?.to) {
      query.createdAt = {
        $gte: filters.customDateRange.from,
        $lte: filters.customDateRange.to,
      };
    }
    // Date filtering
    else if (filters.dateFilter && filters.dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: startDate, $lte: endDate };
          break;
        case 'last7':
          startDate = new Date(now.setDate(now.getDate() - 7));
          startDate.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: startDate };
          break;
        case 'last30':
          startDate = new Date(now.setDate(now.getDate() - 30));
          startDate.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: startDate };
          break;
        default:
          startDate = new Date(0); // fallback
      }

      // For 'today', 'last7', 'last30' — only set $gte
      if (['today', 'last7', 'last30'].includes(filters.dateFilter)) {
        query.createdAt = { $gte: startDate };
      }
    }

    const total = await this.expenseModel.countDocuments(query).exec();
    const data = await this.expenseModel
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

  async findByIdAndUser(id: string, userId: string): Promise<ExpenseDocument> {
    const expense = await this.expenseModel
      .findOne({
        _id: id,
        'created_by.id': userId,
      })
      .exec();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async updateExpense(
    id: string,
    userId: string,
    updateDto: UpdateExpenseDto,
  ): Promise<ExpenseDocument> {
    const expense = await this.findByIdAndUser(id, userId);
    Object.assign(expense, updateDto);
    return expense.save();
  }

  async deleteExpense(id: string, userId: string): Promise<void> {
    const result = await this.expenseModel.deleteOne({
      _id: id,
      'created_by.id': userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Expense not found or unauthorized');
    }
  }

  // 👇 NEW: Get all expenses (for super admin dashboard)
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      searchTerm?: string;
      dateFilter?: string;
      customDateRange?: { from?: Date; to?: Date };
    } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    // Search by name
    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.name = regex;
    }

    // Custom date range support
    if (filters.customDateRange?.from && filters.customDateRange?.to) {
      query.createdAt = {
        $gte: filters.customDateRange.from,
        $lte: filters.customDateRange.to,
      };
    }
    // Date filtering
    else if (filters.dateFilter && filters.dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          query.createdAt = { $gte: startDate };
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: startDate, $lte: endDate };
          break;
        case 'last7':
          startDate = new Date(now.setDate(now.getDate() - 7));
          startDate.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: startDate };
          break;
        case 'last30':
          startDate = new Date(now.setDate(now.getDate() - 30));
          startDate.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: startDate };
          break;
      }
    }

    const total = await this.expenseModel.countDocuments(query).exec();
    const data = await this.expenseModel
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
