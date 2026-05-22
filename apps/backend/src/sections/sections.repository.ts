import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { sections } from '@/drizzle/schema';

@Injectable()
export class SectionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    return this.databaseService.db.select().from(sections);
  }
}