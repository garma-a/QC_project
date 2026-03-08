import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Control Lots')
@ApiBearerAuth()
@Controller('control-lots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlLotsController {
    constructor(private readonly controlLotsService: ControlLotsService) { }

    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create a new control lot', description: 'Creates a new control lot linked to a QC test. The control lot contains the manufacturer-provided expected values (mean, SD, control limits) used to evaluate daily QC results. Only admins can create control lots.' })
    @ApiResponse({ status: 201, description: 'The control lot has been successfully created.' })
    @ApiResponse({ status: 400, description: 'Invalid data (e.g., missing required fields or wrong data types).' })
    @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden — only admins can create control lots.' })
    @ApiResponse({ status: 404, description: 'QC Test not found — the provided testId does not match any existing test.' })
    create(@Body(new ValidationPipe()) createControlLotDto: CreateControlLotDto) {
        return this.controlLotsService.create(createControlLotDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all control lots', description: 'Returns a list of all control lots in the system, including active and inactive ones. Any authenticated user can view control lots.' })
    @ApiResponse({ status: 200, description: 'Returns an array of all control lots.' })
    @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
    findAll() {
        return this.controlLotsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific control lot by ID', description: 'Returns the full details of a single control lot, including its mean, SD, and control/warning limits.' })
    @ApiParam({ name: 'id', description: 'The unique ID of the control lot', example: 1 })
    @ApiResponse({ status: 200, description: 'Returns the control lot data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
    @ApiResponse({ status: 404, description: 'Control lot not found.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.controlLotsService.findOne(id);
    }

    @Roles(Role.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a control lot', description: 'Updates the values of an existing control lot. Use this to correct manufacturer values or adjust limits. Only admins can update control lots.' })
    @ApiParam({ name: 'id', description: 'The unique ID of the control lot to update', example: 1 })
    @ApiResponse({ status: 200, description: 'The control lot has been successfully updated.' })
    @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden — only admins can update control lots.' })
    @ApiResponse({ status: 404, description: 'Control lot not found.' })
    update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe()) updateControlLotDto: UpdateControlLotDto) {
        return this.controlLotsService.update(id, updateControlLotDto);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate a control lot', description: 'Soft-deletes a control lot by setting isActive to false. The lot and its historical QC results are preserved for audit purposes. Only admins can deactivate control lots.' })
    @ApiParam({ name: 'id', description: 'The unique ID of the control lot to deactivate', example: 1 })
    @ApiResponse({ status: 200, description: 'The control lot has been successfully deactivated.' })
    @ApiResponse({ status: 401, description: 'Unauthorized — JWT token missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden — only admins can deactivate control lots.' })
    @ApiResponse({ status: 404, description: 'Control lot not found.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.controlLotsService.remove(id);
    }
}
