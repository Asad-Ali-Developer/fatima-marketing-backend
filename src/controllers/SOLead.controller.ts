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
  SOCreateLeadDto,
  SOLeadStatus,
  SOUpdateLeadDto,
  SOUpdateLeadRemarksDto,
  UpdateLeadDto,
  UpdateLeadRemarksDto,
  UpdateLeadStatusDto
} from 'src/DTOs';
import { SOLeadService } from 'src/services';

@ApiTags('SO Leads')
@Controller('so-leads')
export class SOLeadController {
  constructor(private readonly soLeadService: SOLeadService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lead By Sales Officer' })
  async createLead(@Req() req, @Body() soCreateLeadDto: SOCreateLeadDto) {
    const soId = req.user.userId; // Ensure auth middleware sets this
    const lead = await this.soLeadService.createLead(soId, soCreateLeadDto);

    return {
      message: 'Self Lead created successfully',
      data: lead,
      status: true,
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated leads with filters' })
  async getLeads(
    @Req() req,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const userId = req.user.userId;

    const result = await this.soLeadService.findAllLeads(
      page ?? 1,
      limit ?? 10,
      userId,
      {
        searchTerm,
        status,
        date,
      },
    );

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
    const result = await this.soLeadService.findAllLeadsForSO(
      page ?? 1,
      limit ?? 10,
      {
        searchTerm,
        status,
        date,
      },
    );

    return {
      message: 'SO Leads retrieved successfully',
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
    const officers = await this.soLeadService.getSalesOfficers();
    return {
      message: 'Sales officers retrieved successfully',
      data: officers,
      status: true,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead by ID' })
  async getLeadById(@Param('id') id: string) {
    const lead = await this.soLeadService.findLeadById(id);
    return {
      message: 'SO Lead retrieved successfully',
      data: lead,
      status: true,
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a SO lead' })
  async updateLead(@Param('id') id: string, @Body() updateDto: SOUpdateLeadDto) {
    const lead = await this.soLeadService.updateLead(id, updateDto);
    return {
      message: 'SO Lead updated successfully',
      data: lead,
      status: true,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lead' })
  async deleteLead(@Param('id') id: string) {
    await this.soLeadService.deleteLead(id);
    return {
      message: 'SO Lead deleted successfully',
      status: true,
    };
  }

  @Patch(':id/remarks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for a SO lead' })
  async updateLeadRemarks(
    @Param('id') id: string,
    @Body() updateDto: SOUpdateLeadRemarksDto,
  ) {
    const lead = await this.soLeadService.updateLeadRemarks(
      id,
      updateDto.remarks as string,
    );
    return {
      message: 'SO Remarks updated successfully',
      data: lead,
      status: true,
    };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update remarks for a SO lead' })
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() updateDto: SOUpdateLeadDto,
  ) {
    const lead = await this.soLeadService.updateLeadStatus(
      id,
      updateDto.status as SOLeadStatus,
    );
    return {
      message: 'Remarks updated successfully',
      data: lead,
      status: true,
    };
  }

  @Get('officer/:officerId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get SO leads assigned to a specific sales officer',
  })
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

    const result = await this.soLeadService.getLeadsByOfficer(
      requestingUserId,
      officerId,
      page,
      Math.min(limit, 100), // enforce max limit
    );

    return {
      message: 'SO Leads for officer retrieved successfully',
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
