import { Module } from '@nestjs/common';
import { MachinesService } from '@/machines/machines.service';
import { MachinesController } from '@/machines/machines.controller';
import { MachinesRepository } from './machines.repository';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService, MachinesRepository],
})
export class MachinesModule {}
