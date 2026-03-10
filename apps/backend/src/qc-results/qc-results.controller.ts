import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';

@Controller('qc-results')
export class QcResultsController {
  constructor(private readonly qcResultsService: QcResultsService) {}

  @Post()
  create(@Body() createQcResultDto: CreateQcResultDto) {
    return this.qcResultsService.create(createQcResultDto);
  }

  @Get()
  findAll() {
    return this.qcResultsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qcResultsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQcResultDto: UpdateQcResultDto) {
    return this.qcResultsService.update(+id, updateQcResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qcResultsService.remove(+id);
  }
}
