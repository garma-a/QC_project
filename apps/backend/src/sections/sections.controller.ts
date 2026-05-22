import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all lab sections' })
  @ApiResponse({ status: 200, description: 'Returns all sections.' })
  findAll() {
    return this.sectionsService.findAll();
  }
}