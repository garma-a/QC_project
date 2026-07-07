import { DatabaseService } from '@/database/database.service';
import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { machines, qualityControlTests } from '@/drizzle/schema';

@Injectable()

export class QualityControlTestsRepository {
  constructor(private databaseService: DatabaseService) { }

  async getMachineById(machineId: number) {
    const [machine] = await this.databaseService.db
      .select()
      .from(machines)
      .where(eq(machines.id, machineId))
      .limit(1);

    return machine;

  }

  async createQualityControlTest(qualityControlTest: typeof qualityControlTests.$inferInsert) {
    const [newTest] = await this.databaseService.db
      .insert(qualityControlTests)
      .values(qualityControlTest)
      .returning();
    return newTest;
  }

  async getTestsByMachine(machineId: number, limit?: number, offset?: number) {
    const safeLimit = Math.max(1, Math.min(limit ?? 50, 500));
    const safeOffset = Math.max(0, offset ?? 0);
    let query = this.databaseService.db
      .select()
      .from(qualityControlTests)
      .where(eq(qualityControlTests.machineId, machineId))
      .orderBy(desc(qualityControlTests.id))
      .limit(safeLimit)
      .offset(safeOffset);
    return query;
  }

  async getQualityControlTestById(testId: number) {
    const [test] = await this.databaseService.db
      .select()
      .from(qualityControlTests)
      .where(eq(qualityControlTests.id, testId))
      .limit(1);
    return test;
  }

  async updateQualityControlTest(testId: number, data: Partial<typeof qualityControlTests.$inferInsert>) {
    if (Object.values(data).filter(v => v !== undefined).length === 0) {
      const [current] = await this.databaseService.db
        .select()
        .from(qualityControlTests)
        .where(eq(qualityControlTests.id, testId))
        .limit(1);
      return current;
    }

    const [updated] = await this.databaseService.db
      .update(qualityControlTests)
      .set(data)
      .where(eq(qualityControlTests.id, testId))
      .returning();
    return updated;
  }
  async getAllTests(limit?: number, offset?: number) {
    const safeLimit = Math.max(1, Math.min(limit ?? 50, 500));
    const safeOffset = Math.max(0, offset ?? 0);
    let query = this.databaseService.db
      .select()
      .from(qualityControlTests)
      .orderBy(desc(qualityControlTests.id))
      .limit(safeLimit)
      .offset(safeOffset);
    return query;
  }


}
