import { DatabaseService } from '@/database/database.service';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { machines, qcTests } from '@/drizzle/schema';

@Injectable()

export class QcTestsRepository {
  constructor(private databaseService: DatabaseService) { }

  async getMachineById(machineId: number) {
    const [machine] = await this.databaseService.db
      .select()
      .from(machines)
      .where(eq(machines.id, machineId))
      .limit(1);

    return machine;

  }

  async createQcTest(qcTest: typeof qcTests.$inferInsert) {
    const [newTest] = await this.databaseService.db
      .insert(qcTests)
      .values(qcTest)
      .returning();
    return newTest;
  }

  async getTestsByMachine(machineId: number) {
    return await this.databaseService.db
      .select()
      .from(qcTests)
      .where(eq(qcTests.machineId, machineId));
  }

  async getQcTestById(testId: number) {
    const [test] = await this.databaseService.db
      .select()
      .from(qcTests)
      .where(eq(qcTests.id, testId))
      .limit(1);
    return test;
  }

  async updateQcTest(testId: number, data: Partial<typeof qcTests.$inferInsert>) {
    const [updated] = await this.databaseService.db
      .update(qcTests)
      .set(data)
      .where(eq(qcTests.id, testId))
      .returning();
    return updated;
  }
  async getAllTests() {
    return this.databaseService.db.select().from(qcTests);
  }


}
