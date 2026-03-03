import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { qcTests } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { CreateQcTestDto } from './dto/create-qc-test.dto';


@Injectable()
export class QcTestsService {
    constructor(private databaseService: DatabaseService) {}

    async getTestsByMachine(machineId: number) {
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
