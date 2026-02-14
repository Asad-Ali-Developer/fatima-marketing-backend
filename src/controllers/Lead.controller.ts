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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateLeadDto,
  LeadStatus,
  UpdateLeadDto,
  UpdateLeadRemarksDto,
  UpdateLeadStatusDto,
} from 'src/DTOs';
import { JwtCookieAuthGuard } from 'src/guards';
import { LeadService } from 'src/services';

@ApiTags('Leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async createLead(@Req() req, @Body() createLeadDto: CreateLeadDto) {
    const adminId = req.user.userId; // Ensure auth middleware sets this
    const lead = await this.leadService.createLead(adminId, createLeadDto);

    return {
      message: 'Lead created successfully',
      data: lead,
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated leads with filters' })
  @UseGuards(JwtCookieAuthGuard)
  @Get()
  async getLeads(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {

    const userId = req.user.userId

    const result = await this.leadService.findAllLeads(page ?? 1, limit ?? 10, userId, {
      searchTerm,
      status,
      date,
    });

    return {
      message: 'Leads retrieved successfully',
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

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get paginated leads assigned to the sales officer',
  })
  @UseGuards(JwtCookieAuthGuard)
  @Get('for-so')
  async getLeadsForSO(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const assignedToId = req.user.userId;

    const result = await this.leadService.findAllLeadsForSO(
      page ?? 1,
      limit ?? 10,
      {
        searchTerm,
        status,
        date,
        assignedToId,
      },
    );

    return {
      message: 'Leads retrieved successfully',
      data: result.data, // ✅ Fixed
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sales officers for assignment' })
  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers')
  async getSalesOfficers() {
    const officers = await this.leadService.getSalesOfficers();
    return {
      message: 'Sales officers retrieved successfully',
      data: officers,
      status: true,
    };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers-paginated')
  async getPaginatedSalesOfficers(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    const adminId = req.user.userId;
    const result = await this.leadService.getSalesOfficersByAdmin(
      adminId,
      page,
      limit,
    );
    return { message: 'Success', ...result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtCookieAuthGuard)
  @Get('sales-officers/all')
  async getAllSalesOfficers(@Req() req) {
    const adminId = req.user.userId;

    if (!adminId) {
      throw new BadRequestException('Super Admin ID is missing');
    }

    const salesOfficers =
      await this.leadService.getAllSalesOfficersByAdmin(adminId);

    return {
      message: 'Sales officers retrieved successfully',
      data: salesOfficers,
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead by ID' })
  @UseGuards(JwtCookieAuthGuard)
  @Get(':id')
  async getLeadById(@Param('id') id: string) {
    const lead = await this.leadService.findLeadById(id);
    return {
      message: 'Lead retrieved successfully',
      data: lead,
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lead' })
  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  async updateLead(@Param('id') id: string, @Body() updateDto: UpdateLeadDto) {
    const lead = await this.leadService.updateLead(id, updateDto);
    return {
      message: 'Lead updated successfully',
      data: lead,
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lead' })
  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  async deleteLead(@Param('id') id: string) {
    await this.leadService.deleteLead(id);
    return {
      message: 'Lead deleted successfully',
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for a lead' })
  @UseGuards(JwtCookieAuthGuard)
  @Patch(':id/remarks')
  async updateLeadRemarks(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeadRemarksDto,
  ) {
    const lead = await this.leadService.updateLeadRemarks(
      id,
      updateDto.remarks as string,
    );
    return {
      message: 'Remarks updated successfully',
      data: lead,
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for a lead' })
  @UseGuards(JwtCookieAuthGuard)
  @Patch(':id/status')
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeadStatusDto,
  ) {
    const lead = await this.leadService.updateLeadStatus(
      id,
      updateDto.status as LeadStatus,
    );
    return {
      message: 'Remarks updated successfully',
      data: lead,
      status: true,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get leads assigned to a specific sales officer',
  })
  @UseGuards(JwtCookieAuthGuard)
  @Get('officer/:officerId')
  async getLeadsByOfficer(
    @Req() req,
    @Param('officerId') officerId: string,
    @Query('page') pageStr?: string, // ← string | undefined
    @Query('limit') limitStr?: string, // ← string | undefined
  ) {
    // Safely parse page & limit with defaults
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;

    // Validate after parsing
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const requestingUserId = req.user.userId;

    const result = await this.leadService.getLeadsByOfficer(
      requestingUserId,
      officerId,
      page,
      Math.min(limit, 100), // enforce max limit
    );

    return {
      message: 'Leads for officer retrieved successfully',
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
