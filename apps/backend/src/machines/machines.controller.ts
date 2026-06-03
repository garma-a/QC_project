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
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { MachinesService } from '@/machines/machines.service';
import { CreateMachineDto } from '@/machines/dto/create-machine.dto';
import { UpdateMachineDto } from '@/machines/dto/update-machine.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  create(@Body() createMachineDto: CreateMachineDto) {
    return this.machinesService.create(createMachineDto);
  }

  @Get()
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
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    return this.machinesService.findAll(parsedLimit, parsedOffset);
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.remove(id);
  }
}
