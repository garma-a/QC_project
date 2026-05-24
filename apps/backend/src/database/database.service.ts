import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';


import * as schema from '../drizzle/schema';

@Injectable()
export class DatabaseService {
  public readonly db: PostgresJsDatabase<typeof schema>;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing!');
    }

    // Use postgres-js for local PostgreSQL connections.
    const sql = postgres(databaseUrl);
    this.db = drizzle(sql, { schema });



  }
}
