import { DatabaseService } from '@/database/database.service';
import { controlLots, qcTests } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

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
    // Note: neon-http does not support interactive transactions.
    // We execute these sequentially. In a standard PG environment, this would be wrapped in tx.
    
    // 1. Deactivate existing active lots for this test
    await this.databaseService.db
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
    const [newLot] = await this.databaseService.db
      .insert(controlLots)
      .values(data)
      .returning();

    return newLot;
  }

  async findAll(limit?: number, offset?: number) {
    const safeLimit = Math.min(limit || 50, 50);
    const safeOffset = offset || 0;
    let query = this.databaseService.db
      .select()
      .from(controlLots)
      .orderBy(desc(controlLots.id))
      .limit(safeLimit)
      .offset(safeOffset);
    return await query;
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
