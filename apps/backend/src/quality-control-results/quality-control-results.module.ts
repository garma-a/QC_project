import { Module } from '@nestjs/common';
import { QualityControlResultsService } from './quality-control-results.service';
import { QualityControlResultsController } from './quality-control-results.controller';
import { QualityControlResultsRepository } from './quality-control-results.repository';
import { AlertsModule } from '@/alerts/alerts.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [AlertsModule, UsersModule],
  controllers: [QualityControlResultsController],
  providers: [QualityControlResultsService, QualityControlResultsRepository],
  exports: [QualityControlResultsService],
})
export class QualityControlResultsModule {}
