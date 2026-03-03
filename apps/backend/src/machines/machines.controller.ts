import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MachinesService } from '@/machines/machines.service';
import { CreateMachineDto } from '@/machines/dto/create-machine.dto';
import { UpdateMachineDto } from '@/machines/dto/update-machine.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Machines')
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) { }

  @Post()
  @ApiOperation({ summary: 'Register a new lab machine' })
  @ApiResponse({ status: 201, description: 'The machine has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid data (e.g., missing name or wrong section ID).' })
  create(@Body() createMachineDto: CreateMachineDto) {
    return this.machinesService.create(createMachineDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all machines' })
  @ApiResponse({ status: 200, description: 'Return all machines in the database.' })
  findAll() {
    return this.machinesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific machine' })
  @ApiParam({ name: 'id', description: 'The unique ID of the machine', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns the machine data.' })
  @ApiResponse({ status: 404, description: 'Machine not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update machine details' })
  @ApiResponse({ status: 200, description: 'The machine has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Machine not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMachineDto: UpdateMachineDto
  ) {
    return this.machinesService.update(id, updateMachineDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a machine from the system' })
  @ApiResponse({ status: 200, description: 'The machine has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Machine not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.remove(id);
  }
}
