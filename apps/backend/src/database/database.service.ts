import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '../drizzle/schema';
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly db: NodePgDatabase<typeof schema>;
  private readonly pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('DB_HOST') ?? 'localhost';
    const port = parseInt(this.configService.get<string>('DB_PORT') ?? '5432', 10);
    const database = this.configService.get<string>('DB_NAME');
    const user = this.configService.get<string>('DB_USER');
    const password = this.configService.get<string>('DB_PASSWORD');

    if (!database || !user || !password) {
      throw new Error(
        'Missing required DB environment variables: DB_NAME, DB_USER, DB_PASSWORD',
      );
    }

    this.pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      max: 30,              // Maximum number of connections
      min: 5,               // Minimum idle connections to keep open
      idleTimeoutMillis: 30000,      // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Error out if waiting in queue for > 2 seconds
      maxUses: 7500,         // Close a connection after 7500 uses (prevents memory leaks)
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });

    this.pool.on('connect', () => {
      this.logger.debug('New client connected to the pool');
    });

    this.db = drizzle(this.pool, { schema });

    this.logger.log(`Database pool initialised → ${host}:${port}/${database}`);
  }

  async onModuleDestroy() {
    this.logger.log('Draining database pool...');
    await this.pool.end();
    this.logger.log('Database pool closed.');
  }
}
