import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsRepository } from './alerts.repository';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsRepository],
})
export class AlertsModule {}
