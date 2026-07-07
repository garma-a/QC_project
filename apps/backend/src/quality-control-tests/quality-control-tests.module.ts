import { Module } from '@nestjs/common';
import { QualityControlTestsController } from './quality-control-tests.controller';
import { QualityControlTestsService } from './quality-control-tests.service';
import { QualityControlTestsRepository } from './quality-control-tests.repository';

@Module({
  controllers: [QualityControlTestsController],
  providers: [QualityControlTestsService, QualityControlTestsRepository],
  exports: [QualityControlTestsService],
})
export class QualityControlTestsModule {}
