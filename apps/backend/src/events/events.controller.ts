import { Controller, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { Observable, merge, interval } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';
import { MachinesService } from '@/machines/machines.service';
import { ControlLotsService } from '@/control-lots/control-lots.service';
import { QcTestsService } from '@/qc-tests/qc-tests.service';
import { QcResultsService } from '@/qc-results/qc-results.service';
import { AlertsService } from '@/alerts/alerts.service';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(
    private readonly machinesService: MachinesService,
    private readonly controlLotsService: ControlLotsService,
    private readonly qcTestsService: QcTestsService,
    private readonly qcResultsService: QcResultsService,
    private readonly alertsService: AlertsService,
  ) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Unified real-time event stream',
    description:
      'Single SSE endpoint that multiplexes all entity events (machines, control-lots, qc-tests, qc-results, alerts). ' +
      'Includes a 30-second heartbeat to keep the connection alive through proxies.',
  })
  stream(@CurrentUser('userId') userId: number): Observable<MessageEvent> {
    const heartbeat$ = interval(30_000).pipe(
      map(() => ({ data: { type: 'heartbeat' } }) as MessageEvent),
    );

    const machines$ = this.machinesService.machineEvents$.pipe(
      map((event) => ({ data: { entity: 'machines', ...event } }) as MessageEvent),
    );

    const lots$ = this.controlLotsService.lotEvents$.pipe(
      map((event) => ({ data: { entity: 'control-lots', ...event } }) as MessageEvent),
    );

    const tests$ = this.qcTestsService.testEvents$.pipe(
      map((event) => ({ data: { entity: 'qc-tests', ...event } }) as MessageEvent),
    );

    const results$ = this.qcResultsService.qcResultEvents$.pipe(
      map((event) => ({ data: { entity: 'qc-results', ...event } }) as MessageEvent),
    );

    const alerts$ = this.alertsService.alertEvents$.pipe(
      filter((event) => {
        if (event.userIds) return event.userIds.includes(userId);
        return event.userId === userId;
      }),
      map((event) => ({ data: { entity: 'alerts', ...event } }) as MessageEvent),
    );

    return merge(heartbeat$, machines$, lots$, tests$, results$, alerts$);
  }
}
