import { Module } from '@nestjs/common';
import { BffController } from './bff.controller';
import { BffService } from './bff.service';
import { MachinesModule } from '@/machines/machines.module';
import { ControlLotsModule } from '@/control-lots/control-lots.module';
import { QualityControlResultsModule } from '@/quality-control-results/quality-control-results.module';
import { SectionsModule } from '@/sections/sections.module';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [MachinesModule, ControlLotsModule, QualityControlResultsModule, SectionsModule, DatabaseModule],
  controllers: [BffController],
  providers: [BffService]
})
export class BffModule { }
