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
  Sse,
  MessageEvent,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import type { Request } from 'express';
import { Observable, fromEvent } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';
import { MachinesService } from '@/machines/machines.service';
import { CreateMachineDto } from '@/machines/dto/create-machine.dto';
import { UpdateMachineDto } from '@/machines/dto/update-machine.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MachineResponseDto } from '@/machines/dto/machine-response.dto';
import {
  ValidationErrorResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
} from '@/common/dto/error-response.dto';

@ApiTags('Machines')
@Controller('machines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) { }

  @Post()
  @ApiOperation({
    summary: 'Register a new lab machine',
    description:
      'Creates a new machine entry linked to an existing lab section. The machine starts with `IDLE` status by default. The section must exist or a 400 error is returned.',
  })
  @ApiResponse({
    status: 201,
    description: 'The machine has been successfully created.',
    type: MachineResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid data (e.g., missing name, name too short, or the specified section does not exist).',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'A machine with these details already exists.',
    type: ConflictResponseDto,
  })
  @Roles(Role.ADMIN)
  create(@Body() createMachineDto: CreateMachineDto) {
    return this.machinesService.create(createMachineDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000)
  @ApiOperation({
    summary: 'List all machines',
    description:
      'Returns all machines registered in the system, regardless of status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of all machines.',
    type: [MachineResponseDto],
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
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.machinesService.findAll(limit, offset);
  }



  @Get(':id')
  @ApiOperation({
    summary: 'Get details of a specific machine',
    description:
      'Returns the full details of a single machine by its unique ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the machine',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the machine data.',
    type: MachineResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Machine not found.',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update machine details',
    description:
      'Updates one or more fields of an existing machine. All fields are optional. The section must exist if `sectionId` is provided.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the machine to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'The machine has been successfully updated.',
    type: MachineResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (e.g., the specified section does not exist).',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Machine not found.',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'A machine with these details already exists.',
    type: ConflictResponseDto,
  })
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMachineDto: UpdateMachineDto,
  ) {
    return this.machinesService.update(id, updateMachineDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove a machine from the system',
    description:
      'Permanently deletes a machine record. This will fail if the machine has associated QC tests due to foreign key constraints.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the machine to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'The machine has been successfully deleted. Returns the deleted machine data.',
    type: MachineResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Machine not found.',
    type: NotFoundResponseDto,
  })
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.remove(id);
  }
}
