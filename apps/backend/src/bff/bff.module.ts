import { Module } from '@nestjs/common';
import { BffController } from './bff.controller';
import { BffService } from './bff.service';
import { MachinesModule } from '@/machines/machines.module';
import { ControlLotsModule } from '@/control-lots/control-lots.module';
import { QcResultsModule } from '@/qc-results/qc-results.module';

@Module({
  imports: [MachinesModule, ControlLotsModule, QcResultsModule],
  controllers: [BffController],
  providers: [BffService]
})
export class BffModule { }
