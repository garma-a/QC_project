import { DatabaseService } from '@/database/database.service';
import { machines, qcRuns } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq, sql, max } from 'drizzle-orm';

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
    try {
      const results = await this.databaseService.db
        .select({
          machine: machines,
          lastRunAt: max(qcRuns.runDate),
          testsToday: sql<number>`cast(count(case when cast(${qcRuns.runDate} as date) = current_date then 1 end) as int)`,
        })
        .from(machines)
        .leftJoin(qcRuns, eq(machines.id, qcRuns.machineId))
        .groupBy(machines.id);

      return results.map((r) => ({
        ...r.machine,
        lastRunAt: r.lastRunAt || r.machine.lastRunAt,
        testsToday: r.testsToday,
      }));
    } catch (e) {
      console.error('ERROR in MachinesRepository.findAll:', e);
      throw e;
    }
  }

  async findById(id: number) {
    const results = await this.databaseService.db
      .select({
        machine: machines,
        lastRunAt: max(qcRuns.runDate),
        testsToday: sql<number>`cast(count(case when cast(${qcRuns.runDate} as date) = current_date then 1 end) as int)`,
      })
      .from(machines)
      .leftJoin(qcRuns, eq(machines.id, qcRuns.machineId))
      .where(eq(machines.id, id))
      .groupBy(machines.id);

    if (results.length === 0) return undefined;

    const r = results[0];
    return {
      ...r.machine,
      lastRunAt: r.lastRunAt || r.machine.lastRunAt,
      testsToday: r.testsToday,
    };
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
