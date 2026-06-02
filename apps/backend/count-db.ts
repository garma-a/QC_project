import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);
  const result = await db.execute(sql`SELECT COUNT(*) FROM qc_results`);
  console.log('Total qc_results:', result.rows[0]);
  await client.end();
}
main().catch(console.error);
