import { DatabaseService } from '@/database/database.service';
import { machines } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

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

  async findAll() {
    return await this.databaseService.db.select().from(machines);
  }

  async findById(id: number) {
    const [machine] = await this.databaseService.db
      .select()
      .from(machines)
      .where(eq(machines.id, id));
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
      .delete(machines)
      .where(eq(machines.id, id))
      .returning();
    return deletedMachine;
  }
}
