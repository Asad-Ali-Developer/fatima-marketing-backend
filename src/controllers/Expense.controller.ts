import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateExpenseDto, UpdateExpenseDto } from 'src/DTOs';
import { JwtCookieAuthGuard } from 'src/guards';
import { ExpenseService } from 'src/services';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new expense' })
  async createExpense(@Req() req, @Body() createDto: CreateExpenseDto) {
    const userId = req.user.userId;
    const expense = await this.expenseService.createExpense(userId, createDto);

    return {
      message: 'Expense created successfully',
      expense,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated expenses with filters' })
  async getExpenses(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('dateFilter') dateFilter?: string,
    @Query('customDateFrom') customDateFrom?: string, // 👈 ADDED
    @Query('customDateTo') customDateTo?: string, // 👈 ADDED
  ) {
    const userId = req.user.userId;

    // 👇 Parse custom date range if provided in the query string
    let customDateRange: { from?: Date; to?: Date } = {};
    if (customDateFrom && customDateTo) {
      customDateRange = {
        from: new Date(customDateFrom),
        to: new Date(customDateTo),
      };
    }

    const result = await this.expenseService.findAllByUser(
      userId,
      page ?? 1,
      limit ?? 10,
      {
        searchTerm,
        dateFilter: dateFilter === 'all' ? undefined : dateFilter,
        customDateRange, // 👈 PASSED TO SERVICE
      },
    );

    return {
      message: 'Expenses retrieved successfully',
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

  @UseGuards(JwtCookieAuthGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get expense statistics for different time periods',
  })
  async getExpenseStats(@Req() req) {
    const userId = req.user.userId;

    const stats = await this.expenseService.getExpenseStats(userId);

    return {
      message: 'Expense statistics retrieved successfully',
      data: stats,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get expense by ID' })
  async getExpenseById(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    const expense = await this.expenseService.findByIdAndUser(id, userId);

    return {
      message: 'Expense retrieved successfully',
      expense,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an expense' })
  async updateExpense(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateExpenseDto,
  ) {
    const userId = req.user.userId;
    const expense = await this.expenseService.updateExpense(
      id,
      userId,
      updateDto,
    );

    return {
      message: 'Expense updated successfully',
      expense,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an expense' })
  async deleteExpense(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.expenseService.deleteExpense(id, userId);

    return {
      message: 'Expense deleted successfully',
      status: true,
    };
  }
}
