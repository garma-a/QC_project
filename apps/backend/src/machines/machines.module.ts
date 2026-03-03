import { Module } from '@nestjs/common';
import { MachinesService } from '@/machines/machines.service';
import { MachinesController } from '@/machines/machines.controller';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService],
})
export class MachinesModule { }
