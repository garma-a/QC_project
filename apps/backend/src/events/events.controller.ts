import { Controller, Sse, MessageEvent, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, merge, interval, fromEvent, from } from 'rxjs';
import { map, filter, takeUntil, mergeMap } from 'rxjs/operators';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/users/user.decorator';
import { MachinesService } from '@/machines/machines.service';
import { ControlLotsService } from '@/control-lots/control-lots.service';
import { QualityControlTestsService } from '@/quality-control-tests/quality-control-tests.service';
import { QualityControlResultsService } from '@/quality-control-results/quality-control-results.service';
import { AlertsService } from '@/alerts/alerts.service';
import { UsersRepository } from '@/users/users.repository';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(
    private readonly machinesService: MachinesService,
    private readonly controlLotsService: ControlLotsService,
    private readonly qualityControlTestsService: QualityControlTestsService,
    private readonly qualityControlResultsService: QualityControlResultsService,
    private readonly alertsService: AlertsService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Unified real-time event stream',
    description:
      'Single SSE endpoint that multiplexes all entity events (machines, control-lots, quality-control-tests, quality-control-results, alerts). ' +
      'Includes a 30-second heartbeat to keep the connection alive through proxies.',
  })
  stream(@CurrentUser('userId') userId: number, @Req() req: Request): Observable<MessageEvent> {
    return from(
      Promise.all([
        this.usersRepository.findById(userId),
        this.usersRepository.getSectionIdsForUser(userId),
      ])
    ).pipe(
      mergeMap(([user, userSections]) => {
        const isAdmin = user?.role === 'ADMIN';
        const sectionIds = new Set(userSections);

        const hasAccess = (sectionId?: number): boolean => {
          if (isAdmin) return true;
          if (!sectionId) return false;
          return sectionIds.has(sectionId);
        };

        const heartbeat$ = interval(30_000).pipe(
          map(() => ({ data: { type: 'heartbeat' } }) as MessageEvent),
        );

        const machines$ = this.machinesService.machineEvents$.pipe(
          filter((event) => hasAccess(event.sectionId)),
          map((event) => ({ data: { entity: 'machines', ...event } }) as MessageEvent),
        );

        const lots$ = this.controlLotsService.lotEvents$.pipe(
          filter((event) => hasAccess(event.sectionId)),
          map((event) => ({ data: { entity: 'control-lots', ...event } }) as MessageEvent),
        );

        const tests$ = this.qualityControlTestsService.testEvents$.pipe(
          filter((event) => hasAccess(event.sectionId)),
          map((event) => ({ data: { entity: 'quality-control-tests', ...event } }) as MessageEvent),
        );

        const results$ = this.qualityControlResultsService.qualityControlResultEvents$.pipe(
          filter((event) => hasAccess(event.sectionId)),
          map((event) => ({ data: { entity: 'quality-control-results', ...event } }) as MessageEvent),
        );

        const alerts$ = this.alertsService.alertEvents$.pipe(
          filter((event) => {
            if (event.userIds) return event.userIds.includes(userId);
            return event.userId === userId;
          }),
          map((event) => ({ data: { entity: 'alerts', ...event } }) as MessageEvent),
        );

        return merge(heartbeat$, machines$, lots$, tests$, results$, alerts$).pipe(
          takeUntil(fromEvent(req, 'close')),
        );
      })
    );
  }
}
