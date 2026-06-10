import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { MachinesModule } from '@/machines/machines.module';
import { ControlLotsModule } from '@/control-lots/control-lots.module';
import { QcTestsModule } from '@/qc-tests/qc-tests.module';
import { QcResultsModule } from '@/qc-results/qc-results.module';
import { AlertsModule } from '@/alerts/alerts.module';

@Module({
  imports: [
    MachinesModule,
    ControlLotsModule,
    QcTestsModule,
    QcResultsModule,
    AlertsModule,
  ],
  controllers: [EventsController],
})
export class EventsModule {}
