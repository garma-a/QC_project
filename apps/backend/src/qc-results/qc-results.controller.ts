import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  QcResultResponseDto,
  QcResultsWithLotResponseDto,
  QcResultDetailResponseDto,
  QcRunResponseDto,
} from './dto/qc-result-response.dto';
import {
  ValidationErrorResponseDto,
  UnauthorizedResponseDto,
  NotFoundResponseDto,
} from '@/common/dto/error-response.dto';

@ApiTags('QC Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qc-results')
export class QcResultsController {
  constructor(private readonly qcResultsService: QcResultsService) { }

  @Post()
  @ApiOperation({
    summary: 'Submit a new QC result',
    description:
      'Records a new quality control run containing results for all active control lots for a test. ' +
      'The system automatically evaluates the run against Multi-Lot Westgard Rules (cross-material R_4s, 2_2s) ' +
      'and Single-Lot historical rules (1_3s, 2_2s, R_4s, 2of3_2s, 3_1s, 4_1s, 7_T, and shift rules 6_x, 8_x, 9_x, 10_x, 12_x) ' +
      'as well as the 1_2s warning rule to assign a PASS, WARNING, or FAIL status ' +
      'to each result. All active control lots for the test MUST be submitted together in the same run.',
  })
  @ApiResponse({
    status: 201,
    description: 'The QC run has been successfully recorded and evaluated.',
    type: QcRunResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed, or the control lot is missing required statistical values (mean / standard deviation) needed for evaluation.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Control lot not found.',
    type: NotFoundResponseDto,
  })
  create(
    @Body() createQcResultDto: CreateQcResultDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.qcResultsService.create(createQcResultDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get QC results',
    description: 'If lotId is provided, returns the control lot parameters and an array of all historical QC results for that lot. If not provided, returns all recent QC results.',
  })
  @ApiQuery({
    name: 'lotId',
    required: false,
    description: 'The ID of the control lot to fetch results for (optional)',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the results.',
    type: QcResultsWithLotResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Control lot not found.',
    type: NotFoundResponseDto,
  })
  findAll(
    @Query('lotId') lotId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLotId = lotId ? parseInt(lotId, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    return this.qcResultsService.findAll(parsedLotId, parsedLimit, parsedOffset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get details of a single QC result',
    description:
      'Returns the full details of a single QC result, including the full control lot data and a dynamically calculated Z-Score based on the current lot statistics.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the QC result',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns the QC result with its control lot and dynamically calculated Z-Score.',
    type: QcResultDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Associated control lot is missing statistical data needed for Z-Score calculation.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'QC Result not found.',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.qcResultsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a QC result comment',
    description:
      'Updates only the `comments` field for an existing QC result. The measured value and status cannot be modified to ensure data integrity and audit compliance. Returns the full updated result with Z-Score.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the QC result to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'Comment updated successfully. Returns the full result with Z-Score.',
    type: QcResultDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'QC Result not found.',
    type: NotFoundResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQcResultDto: UpdateQcResultDto,
  ) {
    return this.qcResultsService.update(id, updateQcResultDto);
  }
}
