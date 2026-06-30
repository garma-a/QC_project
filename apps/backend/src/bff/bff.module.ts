import { Module } from '@nestjs/common';
import { BffController } from './bff.controller';
import { BffService } from './bff.service';
import { MachinesModule } from '@/machines/machines.module';
import { ControlLotsModule } from '@/control-lots/control-lots.module';
import { QcResultsModule } from '@/qc-results/qc-results.module';
import { SectionsModule } from '@/sections/sections.module';

@Module({
  imports: [MachinesModule, ControlLotsModule, QcResultsModule, SectionsModule],
  controllers: [BffController],
  providers: [BffService]
})
export class BffModule { }
