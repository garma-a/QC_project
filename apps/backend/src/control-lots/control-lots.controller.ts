import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ControlLotResponseDto,
  ControlLotDeactivateResponseDto,
} from './dto/control-lot-response.dto';
import {
  ValidationErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from '@/common/dto/error-response.dto';

@ApiTags('Control Lots')
@ApiBearerAuth()
@Controller('control-lots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlLotsController {
  constructor(private readonly controlLotsService: ControlLotsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new control lot',
    description:
      'Creates a new control lot linked to a QC test. The control lot contains the manufacturer-provided expected values (mean, SD, control limits) used to evaluate daily QC results. Only admins can create control lots.',
  })
  @ApiResponse({
    status: 201,
    description: 'The control lot has been successfully created.',
    type: ControlLotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (e.g., missing required fields, invalid date format, or wrong data types).',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can create control lots.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'QC Test not found -- the provided testId does not match any existing test.',
    type: NotFoundResponseDto,
  })
  create(@Body() createControlLotDto: CreateControlLotDto) {
    return this.controlLotsService.create(createControlLotDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all control lots',
    description:
      'Returns a list of all control lots in the system, including both active and inactive ones. Any authenticated user can view control lots.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of all control lots.',
    type: [ControlLotResponseDto],
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
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    return this.controlLotsService.findAll(parsedLimit, parsedOffset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific control lot by ID',
    description:
      'Returns the full details of a single control lot, including its statistical parameters (mean, SD, control/warning limits).',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the control lot',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the control lot data.',
    type: ControlLotResponseDto,
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.controlLotsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a control lot',
    description:
      'Updates the values of an existing control lot. Use this to correct manufacturer values, adjust limits, or change the active status. Only admins can update control lots.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the control lot to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'The control lot has been successfully updated.',
    type: ControlLotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (e.g., invalid date format or wrong data types).',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can update control lots.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Control lot not found.',
    type: NotFoundResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateControlLotDto: UpdateControlLotDto,
  ) {
    return this.controlLotsService.update(id, updateControlLotDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a control lot',
    description:
      'Soft-deletes a control lot by setting `isActive` to false. The lot and its historical QC results are preserved for audit purposes. Only admins can deactivate control lots.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the control lot to deactivate',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'The control lot has been deactivated. Returns a confirmation message and the deactivated lot.',
    type: ControlLotDeactivateResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can deactivate control lots.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Control lot not found.',
    type: NotFoundResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.controlLotsService.remove(id);
  }
}
