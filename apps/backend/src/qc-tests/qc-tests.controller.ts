import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { QcTestsService } from './qc-tests.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateQcTestDto } from './dto/create-qc-test.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';

@ApiTags('qc-tests')
@ApiBearerAuth()
@Controller('qc-tests')
@UseGuards(JwtAuthGuard)
export class QcTestsController {
  constructor(private readonly qcTestsService: QcTestsService) { }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new QC test' })
  @ApiBody({ type: CreateQcTestDto })
  @ApiResponse({ status: 201, description: 'QC test created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createQcTestDto: CreateQcTestDto) {
    return this.qcTestsService.create(createQcTestDto);
  }

  @Get('machine/:machineId')
  @ApiOperation({ summary: 'Get QC tests by machine ID' })
  @ApiParam({ name: 'machineId', type: Number, description: 'ID of the machine' })
  @ApiResponse({ status: 200, description: 'List of QC tests for the machine.' })
  @ApiResponse({ status: 404, description: 'Machine not found.' })
  async findByMachine(@Param('machineId', ParseIntPipe) machineId: number) {
    return this.qcTestsService.getTestsByMachine(machineId);
  }
}

