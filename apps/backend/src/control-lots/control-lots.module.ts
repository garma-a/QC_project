import { Module } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { ControlLotsController } from './control-lots.controller';
import { ControlLotsRepository } from './control-lots.repository';

@Module({
  providers: [ControlLotsService, ControlLotsRepository],
  controllers: [ControlLotsController],
  exports: [ControlLotsService],
})
export class ControlLotsModule {}
