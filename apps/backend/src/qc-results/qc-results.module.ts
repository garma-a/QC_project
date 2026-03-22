import { Module } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { QcResultsController } from './qc-results.controller';
import { QcResultsRepository } from './qc-results.repository';
import { AlertsModule } from '@/alerts/alerts.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [AlertsModule, UsersModule],
  controllers: [QcResultsController],
  providers: [QcResultsService, QcResultsRepository],
})
export class QcResultsModule {}
