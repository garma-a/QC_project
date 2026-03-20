import { Module } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { QcResultsController } from './qc-results.controller';
import { QcResultsRepository } from './qc-results.repository';

@Module({
  controllers: [QcResultsController],
  providers: [QcResultsService, QcResultsRepository],
})
export class QcResultsModule {}
