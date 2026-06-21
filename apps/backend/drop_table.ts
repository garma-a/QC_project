import { Pool } from 'pg';
import 'dotenv/config';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('DROP TABLE IF EXISTS "refresh_tokens" CASCADE;');
  console.log('Table dropped successfully.');
  process.exit(0);
}
run().catch(console.error);
