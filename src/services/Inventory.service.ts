// src/services/Inventory.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateInventoryDto, UpdateInventoryDto } from 'src/DTOs';
import { DatabaseProvider } from '../provider/DatabaseProvider';
import {
  InventoryDocument,
  InventorySchema,
} from '../schemas/Inventory.schema';
import { UserService } from './User.service';

@Injectable()
export class InventoryService {
  private inventoryModel: Model<InventoryDocument>;

  constructor(
    private databaseProvider: DatabaseProvider,
    private userService: UserService,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.inventoryModel = connection.model<InventoryDocument>(
      'Inventory',
      InventorySchema,
    );
  }

  // In createInventory method
  async createInventory(
    userId: string,
    createDto: CreateInventoryDto, // ✅ typed DTO
  ): Promise<InventoryDocument> {
    const user = await this.userService.getUserDetailsById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Check uniqueness
    const existing = await this.inventoryModel.findOne({
      registrationNumber: createDto.registrationNumber,
    });
    if (existing) {
      throw new BadRequestException('Registration Number must be unique');
    }

    const inventoryData = {
      registrationNumber: createDto.registrationNumber,
      areaType: createDto.areaType, // ✅
      areaSize: createDto.areaSize, // ✅
      fileType: createDto.fileType,
      created_by: {
        id: userId,
        email: user.email,
        name: user.full_name,
        role_type: user.role?.role_type || 'user',
      },
    };

    const inventory = new this.inventoryModel(inventoryData);
    return inventory.save(); // This will now save all fields
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: { searchTerm?: string } = {},
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const query: any = { 'created_by.id': userId };

    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.registrationNumber = regex;
    }

    const total = await this.inventoryModel.countDocuments(query).exec();
    const data = await this.inventoryModel
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

  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<InventoryDocument> {
    const inventory = await this.inventoryModel
      .findOne({
        _id: id,
        'created_by.id': userId,
      })
      .exec();

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }
    return inventory;
  }

  async updateInventory(
    id: string,
    userId: string,
    updateDto: UpdateInventoryDto,
  ): Promise<InventoryDocument> {
    const inventory = await this.findByIdAndUser(id, userId);

    // Check uniqueness if updating registration number
    if (
      updateDto.registrationNumber &&
      updateDto.registrationNumber !== inventory.registrationNumber
    ) {
      const duplicate = await this.inventoryModel.findOne({
        registrationNumber: updateDto.registrationNumber,
      });
      if (duplicate) {
        throw new BadRequestException('Registration Number must be unique');
      }
    }

    Object.assign(inventory, updateDto);
    return inventory.save();
  }

  async deleteInventory(id: string, userId: string): Promise<void> {
    const result = await this.inventoryModel.deleteOne({
      _id: id,
      'created_by.id': userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Inventory item not found or unauthorized');
    }
  }
}
