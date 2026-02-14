import {
  Req,
  Get,
  Put,
  Body,
  Post,
  Query,
  Param,
  Patch,
  Delete,
  Controller,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  CreateInvoiceDto,
  UpdateInvoiceRemarksDto,
  UpdateInvoiceApprovalDto,
} from 'src/DTOs';
import { JwtCookieAuthGuard } from 'src/guards';
import { InvoiceService } from 'src/services';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new invoice' })
  async createInvoice(@Req() req, @Body() createInvoiceDto: CreateInvoiceDto) {
    const userId = req.user.userId;

    console.log("UserId for the Invoice Creation", userId)
    
    const invoice = await this.invoiceService.createInvoice(
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

    const result = await this.invoiceService.findAllByUser(
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
      await this.invoiceService.findAllInvoicesOfSalesOfficerByUser(
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

    const result = await this.invoiceService.getInvoicesReportedToAdmin(
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
    const invoice = await this.invoiceService.findByIdAndUser(id, userId);

    return {
      message: 'Invoice retrieved successfully',
      data: invoice,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an invoice' })
  async updateInvoice(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    const userId = req.user.userId;
    const invoice = await this.invoiceService.updateInvoice(
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
    @Body() updateDto: UpdateInvoiceApprovalDto,
  ) {
    const adminId = req.user.userId;

    const updatedInvoice =
      await this.invoiceService.updateInvoiceApprovalStatus(
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
    await this.invoiceService.deleteInvoice(id, userId);

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
    @Body() updateDto: UpdateInvoiceRemarksDto,
  ) {
    const userId = req.user.userId;

    const updatedInvoice = await this.invoiceService.updateInvoiceRemarks(
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
}
