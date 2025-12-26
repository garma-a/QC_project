import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from './database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './database/schema';

@Injectable()
export class AppService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}
  getHello(): string {
    return 'Hello World!';
  }
}
