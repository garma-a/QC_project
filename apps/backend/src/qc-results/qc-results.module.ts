import { Module } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { QcResultsController } from './qc-results.controller';

@Module({
  controllers: [QcResultsController],
  providers: [QcResultsService],
})
export class QcResultsModule {}
