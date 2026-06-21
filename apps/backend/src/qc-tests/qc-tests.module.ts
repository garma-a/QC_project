import { Module } from '@nestjs/common';
import { QcTestsController } from './qc-tests.controller';
import { QcTestsService } from './qc-tests.service';
import { QcTestsRepository } from './qc-tests.repository';

@Module({
  controllers: [QcTestsController],
  providers: [QcTestsService, QcTestsRepository],
  exports: [QcTestsService],
})
export class QcTestsModule {}
