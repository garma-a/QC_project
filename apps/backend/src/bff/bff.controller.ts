import { Controller, Get, UseGuards, Query, ParseIntPipe, Param, UseInterceptors } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BffService } from './bff.service';
import { DashboardBffResponseDto } from './dto/dashboard-bff.dto';
import { QcPageMachinesResponseDto, QcPageHistoryResponseDto } from './dto/qc-bff.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';

@ApiTags('BFF (Backend-For-Frontend)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bff')
export class BffController {
  constructor(private readonly bffService: BffService) { }

  @Get('dashboard')

  @ApiOperation({
    summary: 'Get Dashboard Data',
    description: 'Aggregates Machines, active Control Lots, and Recent QC Activity for the frontend Dashboard page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns unified dashboard data.',
    type: DashboardBffResponseDto,
  })
  getDashboardData() {
    return this.bffService.getDashboardData();
  }

  @Get('dashboard/machine-history/:machineId')

  @ApiOperation({
    summary: 'Get Machine History for Dashboard',
    description: 'Returns the last 30 days of QC history for a specific machine to be used in the dashboard charts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns machine history.',
  })
  getDashboardMachineHistory(@Param('machineId', ParseIntPipe) machineId: number) {
    return this.bffService.getDashboardMachineHistory(machineId);
  }

  @Get('qc/machines')

  @ApiOperation({
    summary: 'Get QC Page Machines',
    description: 'Returns machines and categories formatted for the QC Interactive selector.',
  })
  @ApiResponse({
    status: 200,
    type: QcPageMachinesResponseDto,
  })
  getQcPageMachines() {
    return this.bffService.getQcPageMachines();
  }

  @Get('qc/history')

  @ApiOperation({
    summary: 'Get Paginated QC History',
    description: 'Returns paginated QC history perfectly formatted for the Interactive QC Table.',
  })
  @ApiResponse({
    status: 200,
    type: QcPageHistoryResponseDto,
  })
  getQcHistory(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('machineId', new ParseIntPipe({ optional: true })) machineId?: number,
  ) {
    return this.bffService.getQcHistory(limit, offset, machineId);
  }
}
