import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Query,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, fromEvent } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QcTestsService } from './qc-tests.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CreateQcTestDto } from './dto/create-qc-test.dto';
import { UpdateQcTestDto } from './dto/update-qc-test.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';
import { QcTestResponseDto } from './dto/qc-test-response.dto';
import {
  ValidationErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from '@/common/dto/error-response.dto';

@ApiTags('QC Tests')
@ApiBearerAuth()
@Controller('qc-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QcTestsController {
  constructor(private readonly qcTestsService: QcTestsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new QC test',
    description:
      'Creates a new quality control test definition linked to a specific machine. The machine must exist. Only administrators can create QC tests.',
  })
  @ApiBody({ type: CreateQcTestDto })
  @ApiResponse({
    status: 201,
    description: 'QC test created successfully.',
    type: QcTestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (e.g., missing test name or invalid machine ID).',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can create QC tests.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Machine not found.',
    type: NotFoundResponseDto,
  })
  async create(@Body() createQcTestDto: CreateQcTestDto) {
    return this.qcTestsService.create(createQcTestDto);
  }

  @Get('machine/:machineId')
  @ApiOperation({
    summary: 'Get QC tests by machine ID',
    description:
      'Returns all QC test definitions configured on a specific machine. The machine must exist or a 404 is returned.',
  })
  @ApiParam({
    name: 'machineId',
    type: Number,
    description: 'The unique ID of the machine',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Array of QC tests for the specified machine.',
    type: [QcTestResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Machine not found.',
    type: NotFoundResponseDto,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit the number of results returned (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Number of results to skip (default: 0)',
  })
  async findByMachine(
    @Param('machineId', ParseIntPipe) machineId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.qcTestsService.getTestsByMachine(machineId, limit, offset);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all QC tests',
    description: 'Returns every QC test definition across all machines.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of all QC tests.',
    type: [QcTestResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit the number of results returned (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Number of results to skip (default: 0)',
  })
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.qcTestsService.getAll(limit, offset);
  }



  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update a QC test',
    description:
      'Partially updates an existing QC test definition. All fields are optional. Only administrators can update QC tests.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The unique ID of the QC test to update',
    example: 1,
  })
  @ApiBody({ type: UpdateQcTestDto })
  @ApiResponse({
    status: 200,
    description: 'QC test updated successfully.',
    type: QcTestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can update QC tests.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'QC test or target machine not found.',
    type: NotFoundResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQcTestDto: UpdateQcTestDto,
  ) {
    return this.qcTestsService.update(id, updateQcTestDto);
  }
}
