import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
async function drop() {
  try {
    await sql`DROP TABLE IF EXISTS qc_results CASCADE;`;
    await sql`DROP TABLE IF EXISTS qc_runs CASCADE;`;
    await sql`DROP TABLE IF EXISTS control_lots CASCADE;`;
    console.log("Dropped tables");
  } catch (e) {
    console.error(e);
  }
}
drop();
