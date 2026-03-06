import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { QcTestsService } from './qc-tests.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateQcTestDto } from './dto/create-qc-test.dto';
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('qc-tests')
@UseGuards(JwtAuthGuard)
export class QcTestsController {
    constructor (private readonly qcTestsService:QcTestsService){}

   @Post()
   @Roles('ADMIN')
  async create(@Body() createQcTestDto: CreateQcTestDto) {
    return this.qcTestsService.create(createQcTestDto);
  }

  @Get('machine/:machineId')
  async findByMachine(@Param('machineId', ParseIntPipe) machineId: number) {
    return this.qcTestsService.getTestsByMachine(machineId);
  }
}
