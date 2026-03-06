import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { qcTests,machines } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { CreateQcTestDto } from './dto/create-qc-test.dto';


@Injectable()
export class QcTestsService {
    constructor(private databaseService: DatabaseService) {}

  async getTestsByMachine(machineId: number) {
 
  const machineExists = await this.databaseService.db
    .select()
    .from(machines)
    .where(eq(machines.id, machineId));

  if (machineExists.length === 0) {
    throw new NotFoundException(`Machine with ID #${machineId} does not exist`);
  }

  
  return await this.databaseService.db
    .select()
    .from(qcTests)
    .where(eq(qcTests.machineId, machineId));
}

  async create(createQcTestDto: CreateQcTestDto) {
    const [newTest] = await this.databaseService.db
      .insert(qcTests)
      .values(createQcTestDto)
      .returning();
    return newTest;
  }
}
