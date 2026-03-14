import { Module } from '@nestjs/common';
import { QcTestsController } from './qc-tests.controller';
import { QcTestsService } from './qc-tests.service';

@Module({
  controllers: [QcTestsController],
  providers: [QcTestsService]
})
export class QcTestsModule {}
