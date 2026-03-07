import { Module } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { ControlLotsController } from './control-lots.controller';

@Module({
  providers: [ControlLotsService],
  controllers: [ControlLotsController]
})
export class ControlLotsModule {}
