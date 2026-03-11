import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('qc-results')
export class QcResultsController {
  constructor(private readonly qcResultsService: QcResultsService) { }

  @Post()
  create(@Body() createQcResultDto: CreateQcResultDto, @CurrentUser('userId') userId: number) {
    return this.qcResultsService.create(createQcResultDto, userId);
  }

  @Get()
  findAll(@Query('lotId', ParseIntPipe) lotId: number) {
    return this.qcResultsService.findAll(lotId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.qcResultsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateQcResultDto: UpdateQcResultDto) {
    return this.qcResultsService.update(id, updateQcResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qcResultsService.remove(+id);
  }
}
