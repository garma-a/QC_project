import { ParseIntPipe, Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
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
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit the number of results returned (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Number of results to skip (default: 0)',
  })
  findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.sectionsService.findAll(limit, offset);
  }
}