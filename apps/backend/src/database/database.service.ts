import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../drizzle/schema';

@Injectable()
export class DatabaseService {
  public readonly db: PostgresJsDatabase<typeof schema>;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing!');
    }

    const sql = neon(databaseUrl);
    this.db = drizzle(sql, { schema });
  }
}