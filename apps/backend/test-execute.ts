import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);
  
  const query = sql`
    SELECT 
      r.id as id,
      r."measured_value" as "measuredValue",
      r.z_score as "zScore",
      r.violated_rule as "violatedRule",
      r.status as status,
      r.comments as comments,
      r.run_id as "runId",
      r.lot_id as "lotId",
      run.run_date as "testDate",
      run.performed_by as "performedBy"
    FROM (
      SELECT 
        id, measured_value, z_score, violated_rule, status, comments, run_id, lot_id,
        ROW_NUMBER() OVER(PARTITION BY lot_id ORDER BY id DESC) as rn
      FROM qc_results
    ) r
    JOIN qc_runs run ON r.run_id = run.id
    WHERE r.rn <= 30
    ORDER BY run.run_date DESC
    LIMIT 2
  `;
  const result = await db.execute(query);
  console.log(result.rows ? "HAS ROWS" : "NO ROWS");
  console.log(result.rows ? result.rows : result);
  await client.end();
}
main().catch(console.error);
