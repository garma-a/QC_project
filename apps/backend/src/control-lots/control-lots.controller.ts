import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';

@Controller('control-lots')
export class ControlLotsController {
    constructor(private readonly controlLotsService: ControlLotsService) { }

    @Post()
    create(@Body(new ValidationPipe()) createControlLotDto: CreateControlLotDto) {
        return this.controlLotsService.create(createControlLotDto);
    }

    @Get()
    findAll() {
        return this.controlLotsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.controlLotsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body(new ValidationPipe()) updateControlLotDto: UpdateControlLotDto) {
        return this.controlLotsService.update(+id, updateControlLotDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.controlLotsService.remove(+id);
    }
}
