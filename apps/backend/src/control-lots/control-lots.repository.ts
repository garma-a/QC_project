import { DatabaseService } from '@/database/database.service';
import { controlLots, qcTests } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

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

  async create(data: typeof controlLots.$inferInsert) {
    const [newLot] = await this.databaseService.db
      .insert(controlLots)
      .values(data)
      .returning();
    return newLot;
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
