import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BffService } from './bff.service';
import { DashboardBffResponseDto } from './dto/dashboard-bff.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';

@ApiTags('BFF (Backend-For-Frontend)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bff')
export class BffController {
  constructor(private readonly bffService: BffService) {}

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
}
