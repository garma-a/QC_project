import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import 'dotenv/config';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);
  
  const result = await db.execute(`
    SELECT r.id, r."measuredValue", r."lotId", run."runDate" as "testDate"
    FROM (
      SELECT id, "measuredValue", "runId", "lotId",
             ROW_NUMBER() OVER(PARTITION BY "lotId" ORDER BY id DESC) as rn
      FROM qc_results
    ) r
    JOIN qc_runs run ON r."runId" = run.id
    WHERE r.rn <= 30
    ORDER BY run."runDate" DESC
    LIMIT 1;
  `);
  console.log(result.rows);
  await client.end();
}
main().catch(console.error);
