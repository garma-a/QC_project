import { DatabaseService } from '@/database/database.service';
import { machines } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class MachinesRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(data: typeof machines.$inferInsert) {
    const [newMachine] = await this.databaseService.db
      .insert(machines)
      .values(data)
      .returning();
    return newMachine;
  }

  async findAll(limit?: number, offset?: number) {
    const safeLimit = Math.max(1, Math.min(limit ?? 50, 10000));
    const safeOffset = Math.max(0, offset ?? 0);
    
    let query = this.databaseService.db
      .select()
      .from(machines)
      .where(eq(machines.isActive, true))
      .orderBy(desc(machines.id))
      .limit(safeLimit)
      .offset(safeOffset);
      
    return await query;
  }

  async findById(id: number) {
    const [machine] = await this.databaseService.db
      .select()
      .from(machines)
      .where(and(eq(machines.id, id), eq(machines.isActive, true)));
    return machine;
  }

  async update(id: number, data: Partial<typeof machines.$inferInsert>) {
    const [updatedMachine] = await this.databaseService.db
      .update(machines)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(machines.id, id))
      .returning();
    return updatedMachine;
  }

  async delete(id: number) {
    const [deletedMachine] = await this.databaseService.db
      .update(machines)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(machines.id, id))
      .returning();
    return deletedMachine;
  }
}
