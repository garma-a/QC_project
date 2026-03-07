import { Module } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { ControlLotsController } from './control-lots.controller';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ControlLotsService],
  controllers: [ControlLotsController]
})
export class ControlLotsModule { }
