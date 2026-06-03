import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AlertsService } from '@/alerts/alerts.service';
import { CurrentUser } from '@/users/user.decorator';
import {
  AlertResponseDto,
  UserAlertStatusResponseDto,
} from '@/alerts/dto/alert-response.dto';
import { ResolveAlertDto } from '@/alerts/dto/resolve-alert.dto';
import {
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '@/common/dto/error-response.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) { }

  @Get()
  @ApiOperation({
    summary: 'List current user alerts',
    description:
      'Returns alert records assigned to the authenticated user, including metadata such as priority, rule violated, and creation time.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of alerts returned successfully.',
    type: [AlertResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    return await this.alertsService.findAllByUser(userId, parsedLimit, parsedOffset);
  }

  @Patch('/mark-seen/:id')
  @ApiOperation({
    summary: 'Mark an alert as seen',
    description:
      "Marks the authenticated user's alert notification state as `SEEN` and sets the `seenAt` timestamp.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The alert ID to mark as seen',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'User-alert status updated to seen.',
    type: [UserAlertStatusResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid alert ID format.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  async markSeen(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.alertsService.markSeen(id, userId);
  }


  @Patch('/mark-resolved/:id')
  @ApiOperation({
    summary: 'Mark an alert as resolved',
    description:
      "Marks the authenticated user's alert notification state as `RESOLVED`, sets the `resolvedAt` timestamp, and stores an optional resolution note.",
  })
  @ApiBody({ type: ResolveAlertDto, required: false })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The alert ID to mark as resolved',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'User-alert status updated to resolved.',
    type: [UserAlertStatusResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid alert ID format.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT token missing or invalid.',
    type: UnauthorizedResponseDto,
  })
  async markResolved(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() resolveAlertDto?: ResolveAlertDto,
  ) {
    return await this.alertsService.markResolved(
      id,
      userId,
      resolveAlertDto?.resolutionNote,
    );
  }

}
