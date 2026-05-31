import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all lab sections',
    description:
      'Retrieves a list of all laboratory sections. ' +
      'Requires a valid JWT bearer token. ' +
      'Sections are used to group machines within the lab.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all lab sections successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
  })
  findAll() {
    return this.sectionsService.findAll();
  }
}