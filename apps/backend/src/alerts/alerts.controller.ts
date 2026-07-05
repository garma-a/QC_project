import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, fromEvent } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
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
  @ApiQuery({
    name: 'scope',
    type: String,
    required: false,
    description: 'Scope of alerts ("assigned" or "all"). Default is "assigned".',
  })
  @ApiQuery({
    name: 'sectionId',
    type: Number,
    required: false,
    description: 'Filter alerts by section ID',
  })
  @ApiQuery({
    name: 'machineId',
    type: Number,
    required: false,
    description: 'Filter alerts by machine ID',
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false,
    description: 'Filter alerts by status (e.g. UNSEEN, SEEN, RESOLVED)',
  })
  @ApiQuery({
    name: 'timeRange',
    type: String,
    required: false,
    description: 'Filter alerts by time range (24h, 7d)',
  })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('scope') scope?: 'assigned' | 'all',
    @Query('sectionId', new ParseIntPipe({ optional: true })) sectionId?: number,
    @Query('machineId', new ParseIntPipe({ optional: true })) machineId?: number,
    @Query('status') status?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    if (scope === 'all' || sectionId || machineId) {
      return await this.alertsService.findAll(userId, limit, offset, sectionId, machineId, status, timeRange);
    }
    return await this.alertsService.findAllByUser(userId, limit, offset, status, timeRange);
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


  @Patch('/mark-unseen/:id')
  @ApiOperation({
    summary: 'Mark an alert as unseen',
    description: 'Marks the authenticated user\'s alert notification state as `UNSEEN`.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: [UserAlertStatusResponseDto] })
  async markUnseen(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.alertsService.markUnseen(id, userId);
  }

  @Patch('/mark-unresolved/:id')
  @ApiOperation({
    summary: 'Mark an alert as unresolved',
    description: 'Marks the authenticated user\'s alert notification state as `SEEN` (unresolved).',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: [UserAlertStatusResponseDto] })
  async markUnresolved(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.alertsService.markUnresolved(id, userId);
  }

}
