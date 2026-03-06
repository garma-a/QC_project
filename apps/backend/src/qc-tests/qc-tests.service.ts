import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { qcTests, machines } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { CreateQcTestDto } from './dto/create-qc-test.dto';

@Injectable()
export class QcTestsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createQcTestDto: CreateQcTestDto) {
    // 1. Check existence using the limit chain
    const machine = await this.databaseService.db
      .select()
      .from(machines)
      .where(eq(machines.id, createQcTestDto.machineId))
      .limit(1);

    // Because .select() returns an array, we check length
    if (machine.length === 0) {
      throw new NotFoundException(`Cannot create test: Machine #${createQcTestDto.machineId} not found`);
    }

    const [newTest] = await this.databaseService.db
      .insert(qcTests)
      .values(createQcTestDto)
      .returning();
      
    return newTest;
  }

  async getTestsByMachine(machineId: number) {
    // 1. Check existence using the limit chain
    const machine = await this.databaseService.db
      .select() 
      .from(machines)
      .where(eq(machines.id, machineId))
      .limit(1);

    if (machine.length === 0) {
      throw new NotFoundException(`Machine #${machineId} not found`);
    }

    return await this.databaseService.db
      .select()
      .from(qcTests)
      .where(eq(qcTests.machineId, machineId));
  }
}