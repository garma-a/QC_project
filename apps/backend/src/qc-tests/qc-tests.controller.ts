import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { QcTestsService } from './qc-tests.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CreateQcTestDto } from './dto/create-qc-test.dto';
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
  async findByMachine(@Param('machineId', ParseIntPipe) machineId: number) {
    return this.qcTestsService.getTestsByMachine(machineId);
  }
}
