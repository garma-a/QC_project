import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { MachinesModule } from '@/machines/machines.module';
import { ControlLotsModule } from '@/control-lots/control-lots.module';
import { QualityControlTestsModule } from '@/quality-control-tests/quality-control-tests.module';
import { QualityControlResultsModule } from '@/quality-control-results/quality-control-results.module';
import { AlertsModule } from '@/alerts/alerts.module';

import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    MachinesModule,
    ControlLotsModule,
    QualityControlTestsModule,
    QualityControlResultsModule,
    AlertsModule,
    UsersModule,
  ],
  controllers: [EventsController],
})
export class EventsModule {}
