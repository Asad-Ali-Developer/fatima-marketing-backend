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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateLeadDto,
  LeadStatus,
  UpdateLeadDto,
  UpdateLeadRemarksDto,
  UpdateLeadStatusDto,
} from 'src/DTOs';
import { LeadService } from 'src/services';

@ApiTags('Leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lead' })
  async createLead(@Req() req, @Body() createLeadDto: CreateLeadDto) {
    const adminId = req.user.userId; // Ensure auth middleware sets this

    console.log("Create Lead DTO: ", createLeadDto)

    const lead = await this.leadService.createLead(adminId, createLeadDto);

    return {
      message: 'Lead created successfully',
      data: lead,
      status: true,
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated leads with filters' })
  async getLeads(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const result = await this.leadService.findAllLeads(page ?? 1, limit ?? 10, {
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

  @Get('for-so')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get paginated leads assigned to the sales officer',
  })
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

  @Get('sales-officers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sales officers for assignment' })
  async getSalesOfficers() {
    const officers = await this.leadService.getSalesOfficers();
    return {
      message: 'Sales officers retrieved successfully',
      data: officers,
      status: true,
    };
  }

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

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead by ID' })
  async getLeadById(@Param('id') id: string) {
    const lead = await this.leadService.findLeadById(id);
    return {
      message: 'Lead retrieved successfully',
      data: lead,
      status: true,
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lead' })
  async updateLead(@Param('id') id: string, @Body() updateDto: UpdateLeadDto) {
    const lead = await this.leadService.updateLead(id, updateDto);
    return {
      message: 'Lead updated successfully',
      data: lead,
      status: true,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lead' })
  async deleteLead(@Param('id') id: string) {
    await this.leadService.deleteLead(id);
    return {
      message: 'Lead deleted successfully',
      status: true,
    };
  }

  @Patch(':id/remarks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for a lead' })
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

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for a lead' })
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
}
