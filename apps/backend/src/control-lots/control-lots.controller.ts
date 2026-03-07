import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/auth.types';

@Controller('control-lots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlLotsController {
    constructor(private readonly controlLotsService: ControlLotsService) { }

    @Post()

    @Roles(Role.ADMIN)
    create(@Body(new ValidationPipe()) createControlLotDto: CreateControlLotDto) {
        return this.controlLotsService.create(createControlLotDto);
    }

    @Get()
    findAll() {
        return this.controlLotsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.controlLotsService.findOne(id);
    }

    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe()) updateControlLotDto: UpdateControlLotDto) {
        return this.controlLotsService.update(id, updateControlLotDto);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.controlLotsService.remove(id);
    }
}
