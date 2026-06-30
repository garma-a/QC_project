import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsRepository } from './alerts.repository';
import { EmailModule } from '@/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsRepository],
  exports: [AlertsService],
})
export class AlertsModule {}
