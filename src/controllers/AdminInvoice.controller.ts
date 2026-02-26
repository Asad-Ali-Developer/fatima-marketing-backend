import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateAdminInvoiceDto,
  UpdateAdminInvoiceApprovalDto,
  UpdateAdminInvoiceRemarksDto,
  UpdateInvoiceRemarksDto,
} from 'src/DTOs';
import { JwtCookieAuthGuard } from 'src/guards';
import { AdminInvoiceService } from 'src/services';

@ApiTags('Admin Invoices')
@Controller('admin-invoices')
export class AdminInvoiceController {
  constructor(private readonly adminInvoiceService: AdminInvoiceService) {}

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new invoice' })
  async createInvoice(
    @Req() req,
    @Body() createInvoiceDto: CreateAdminInvoiceDto,
  ) {
    const userId = req.user.userId;

    console.log('UserId for the Invoice Creation', userId);

    const invoice = await this.adminInvoiceService.createAdminInvoice(
      userId,
      createInvoiceDto,
    );

    return {
      message: 'Invoice created successfully',
      data: invoice,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated invoices with filters' })
  async getInvoices(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const userId = req.user.userId;

    const result = await this.adminInvoiceService.findAllByUser(
      userId,
      page ?? 1,
      limit ?? 10,
      {
        searchTerm,
        status,
        date,
      },
    );

    return {
      message: 'Invoices retrieved successfully',
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
  @Get('sales-officers-invoices')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get invoices for a sales officer with time-range filters',
  })
  async findAllInvoicesOfSalesOfficerByUser(
    @Query('salesOfficerId') salesOfficerId: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('timeRange')
    timeRange?: 'lastWeek' | 'lastMonth' | 'last6Months' | 'lastYear',
    @Query('from') from?: string, // ISO string or YYYY-MM-DD
    @Query('to') to?: string, // ISO string or YYYY-MM-DD
  ) {
    if (!salesOfficerId) {
      throw new BadRequestException('salesOfficerId is required');
    }

    const result =
      await this.adminInvoiceService.findAllInvoicesOfSalesOfficerByUser(
        salesOfficerId,
        {
          searchTerm,
          status,
          timeRange,
          from,
          to,
        },
      );

    return {
      message: 'Invoices retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
      },
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('reported-to-me')
  @ApiOperation({ summary: 'Get invoices reported to logged-in admin' })
  @ApiBearerAuth()
  async getInvoicesReportedToMe(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const adminId = req.user.userId; // Ensure your auth middleware sets this

    const result =
      await this.adminInvoiceService.getAdminInvoicesReportedToAdmin(
        adminId,
        page ?? 1,
        limit ?? 10,
        { searchTerm, status, date },
      );

    return {
      message: 'Invoices retrieved successfully',
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
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice by ID' })
  async getInvoiceById(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    const invoice = await this.adminInvoiceService.findByIdAndUser(id, userId);

    return {
      message: 'Invoice retrieved successfully',
      data: invoice,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an admin invoice' })
  async updateAdminInvoice(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    const userId = req.user.userId;
    const invoice = await this.adminInvoiceService.updateAdminInvoice(
      id,
      userId,
      updateDto,
    );

    return {
      message: 'Invoice updated successfully',
      data: invoice,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Patch(':id/approval-status')
  @ApiOperation({ summary: 'Update admin approval status for an invoice' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Approval status updated successfully' })
  async updateApprovalStatus(
    @Req() req,
    @Param('id') invoiceId: string,
    @Body() updateDto: UpdateAdminInvoiceApprovalDto,
  ) {
    const adminId = req.user.userId;

    const updatedInvoice =
      await this.adminInvoiceService.updateAdminInvoiceApprovalStatus(
        invoiceId,
        adminId,
        updateDto,
      );

    return {
      message: 'Approval status updated successfully',
      updatedInvoice,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an invoice' })
  async deleteInvoice(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.adminInvoiceService.deleteAdminInvoice(id, userId);

    return {
      message: 'Invoice deleted successfully',
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Patch(':id/remarks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for an invoice' })
  async updateInvoiceRemarks(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateAdminInvoiceRemarksDto,
  ) {
    const userId = req.user.userId;

    const updatedInvoice =
      await this.adminInvoiceService.updateAdminInvoiceRemarks(
        id,
        userId,
        updateDto.remarks,
      );

    return {
      message: 'Remarks updated successfully',
      data: updatedInvoice,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officer/:salesOfficerId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get invoices created by a specific sales officer with filters',
  })
  async getInvoicesBySalesOfficer(
    @Param('salesOfficerId') salesOfficerId: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const result = await this.adminInvoiceService.getInvoicesBySalesOfficer(
      salesOfficerId,
      page ?? 1,
      limit ?? 10,
      {
        searchTerm,
        status,
        dateFrom,
        dateTo,
      },
    );

    return {
      message: 'Sales Officer invoices retrieved successfully',
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
}
