import { DatabaseService } from '@/database/database.service';
import * as schema from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class MachinesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: typeof schema.machines.$inferInsert) {
    const [newMachine] = await this.databaseService.db
      .insert(schema.machines)
      .values(data)
      .returning();
    return newMachine;
  }

  async findAll() {
    return await this.databaseService.db.select().from(schema.machines);
  }

  async findById(id: number) {
    const [machine] = await this.databaseService.db
      .select()
      .from(schema.machines)
      .where(eq(schema.machines.id, id));
    return machine;
  }

  async update(id: number, data: Partial<typeof schema.machines.$inferInsert>) {
    const [updatedMachine] = await this.databaseService.db
      .update(schema.machines)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.machines.id, id))
      .returning();
    return updatedMachine;
  }

  async delete(id: number) {
    const [deletedMachine] = await this.databaseService.db
      .delete(schema.machines)
      .where(eq(schema.machines.id, id))
      .returning();
    return deletedMachine;
  }
}
