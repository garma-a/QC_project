import { DatabaseService } from '@/database/database.service';
import { controlLots, qcTests } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

/** Shape returned by {@link findActiveWithTestContext} */
export type ActiveLotWithTestContext = {
  id: number;
  testId: number;
  level: number;
  lotNumber: string;
  expirationDate: Date;
  targetValue: number | null;
  mean: number | null;
  standardDeviation: number | null;
  upperControlLimit: number | null;
  lowerControlLimit: number | null;
  upperWarningLimit: number | null;
  lowerWarningLimit: number | null;
  isActive: boolean | null;
  createdAt: Date | null;
  // Embedded from qc_tests join
  testName: string;
  testType: string | null;
  machineId: number;
};

@Injectable()
export class ControlLotsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findTestById(testId: number) {
    const [test] = await this.databaseService.db
      .select()
      .from(qcTests)
      .where(eq(qcTests.id, testId));
    return test;
  }

  async createWithDeactivation(testId: number, data: typeof controlLots.$inferInsert) {
    return this.databaseService.db.transaction(async (tx) => {
      // 1. Deactivate existing active lots for this test
      await tx
        .update(controlLots)
        .set({ isActive: false })
        .where(
          and(
            eq(controlLots.testId, testId),
            eq(controlLots.isActive, true),
            eq(controlLots.level, data.level ?? 1)
          )
        );

      // 2. Create the new lot
      const [newLot] = await tx
        .insert(controlLots)
        .values(data)
        .returning();

      return newLot;
    });
  }

  async findAll(limit?: number, offset?: number) {
    const safeLimit = Math.max(1, Math.min(limit ?? 50, 10000));
    const safeOffset = Math.max(0, offset ?? 0);
    const query = this.databaseService.db
      .select()
      .from(controlLots)
      .orderBy(desc(controlLots.id))
      .limit(safeLimit)
      .offset(safeOffset);
    return await query;
  }

  /**
   * Returns ALL active control lots joined with their parent QC test.
   * Used by the dashboard to get test context without a separate /qc-tests call.
   * Scales well because active lots are a tiny fraction of total lots.
   */
  async findActiveWithTestContext(): Promise<ActiveLotWithTestContext[]> {
    return this.databaseService.db
      .select({
        id: controlLots.id,
        testId: controlLots.testId,
        level: controlLots.level,
        lotNumber: controlLots.lotNumber,
        expirationDate: controlLots.expirationDate,
        targetValue: controlLots.targetValue,
        mean: controlLots.mean,
        standardDeviation: controlLots.standardDeviation,
        upperControlLimit: controlLots.upperControlLimit,
        lowerControlLimit: controlLots.lowerControlLimit,
        upperWarningLimit: controlLots.upperWarningLimit,
        lowerWarningLimit: controlLots.lowerWarningLimit,
        isActive: controlLots.isActive,
        createdAt: controlLots.createdAt,
        // Embedded test context
        testName: qcTests.testName,
        testType: qcTests.testType,
        machineId: qcTests.machineId,
      })
      .from(controlLots)
      .innerJoin(qcTests, eq(controlLots.testId, qcTests.id))
      .where(eq(controlLots.isActive, true))
      .orderBy(desc(controlLots.id));
  }

  async findById(id: number) {
    const [lot] = await this.databaseService.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.id, id));
    return lot;
  }

  async findByTestId(testId: number) {
    return await this.databaseService.db
      .select()
      .from(controlLots)
      .where(eq(controlLots.testId, testId));
  }

  async update(id: number, data: Partial<typeof controlLots.$inferInsert>) {
    const [updatedLot] = await this.databaseService.db
      .update(controlLots)
      .set(data)
      .where(eq(controlLots.id, id))
      .returning();
    return updatedLot;
  }

  async deactivate(id: number) {
    const [deactivatedLot] = await this.databaseService.db
      .update(controlLots)
      .set({ isActive: false })
      .where(eq(controlLots.id, id))
      .returning();
    return deactivatedLot;
  }
}
