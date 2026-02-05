import {
  Req,
  Put,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from 'src/services';
import { CreateInventoryDto, UpdateInventoryDto } from 'src/DTOs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new inventory item' })
  async createInventory(@Req() req, @Body() createDto: CreateInventoryDto) {
    const userId = req.user.userId;
    const inventory = await this.inventoryService.createInventory(
      userId,
      createDto,
    );

    return {
      message: 'Inventory item created successfully',
      data: inventory,
      status: true,
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated inventory items with search filter' })
  async getInventory(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
  ) {
    const userId = req.user.userId;
    const result = await this.inventoryService.findAllByUser(
      userId,
      page ?? 1,
      limit ?? 10,
      { searchTerm },
    );

    return {
      message: 'Inventory retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
      status: true,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async getInventoryById(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    const inventory = await this.inventoryService.findByIdAndUser(id, userId);

    return {
      message: 'Inventory item retrieved successfully',
      data: inventory,
      status: true,
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an inventory item' })
  async updateInventory(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryDto,
  ) {
    const userId = req.user.userId;
    const inventory = await this.inventoryService.updateInventory(
      id,
      userId,
      updateDto,
    );

    return {
      message: 'Inventory updated successfully',
      data: inventory,
      status: true,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an inventory item' })
  async deleteInventory(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.inventoryService.deleteInventory(id, userId);

    return {
      message: 'Inventory item deleted successfully',
      status: true,
    };
  }
}
