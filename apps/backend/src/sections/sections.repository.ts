import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { sections } from '@/drizzle/schema';

import { desc } from 'drizzle-orm';

@Injectable()
export class SectionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(limit?: number, offset?: number) {
    const safeLimit = Math.max(1, Math.min(limit ?? 50, 100));
    const safeOffset = Math.max(0, offset ?? 0);
    return this.databaseService.db
      .select()
      .from(sections)
      .orderBy(desc(sections.id))
      .limit(safeLimit)
      .offset(safeOffset);
  }
}