import { DatabaseService } from '@/database/database.service';
import { controlLots, qcTests } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';

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
    // We use manual compensation to undo partial changes on failure.

    // 1. Identify the active lots that will be deactivated
    const lotsToDeactivate = await this.databaseService.db
      .select({ id: controlLots.id })
      .from(controlLots)
      .where(
        and(
          eq(controlLots.testId, testId),
          eq(controlLots.isActive, true),
          eq(controlLots.level, data.level ?? 1),
        ),
      );

    const deactivatedIds = lotsToDeactivate.map((l) => l.id);

    // 2. Deactivate existing active lots for this test + level
    if (deactivatedIds.length > 0) {
      await this.databaseService.db
        .update(controlLots)
        .set({ isActive: false })
        .where(inArray(controlLots.id, deactivatedIds));
    }

    // 3. Insert the new lot — compensate on failure
    try {
      const [newLot] = await this.databaseService.db
        .insert(controlLots)
        .values(data)
        .returning();

      return newLot;
    } catch (error) {
      // Compensation: reactivate the exact lots we just deactivated
      if (deactivatedIds.length > 0) {
        await this.databaseService.db
          .update(controlLots)
          .set({ isActive: true })
          .where(inArray(controlLots.id, deactivatedIds));
      }
      throw error;
    }
  }

  async findAll() {
    return await this.databaseService.db.select().from(controlLots);
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
