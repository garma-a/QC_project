import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
async function fix() {
  try {
    await sql`ALTER TABLE control_lots ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;`;
    console.log("Added level to control_lots");
    await sql`ALTER TABLE qc_results ADD COLUMN IF NOT EXISTS z_score double precision;`;
    console.log("Added z_score to qc_results");
  } catch (e) {
    console.error(e);
  }
}
fix();
