import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST ?? 'localhost';
const port = process.env.DB_PORT ?? '5432';
const database = process.env.DB_NAME ?? 'qc_project';
const user = process.env.DB_USER ?? 'postgres';
const password = process.env.DB_PASSWORD ?? 'postgres';

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port: parseInt(port, 10),
    database,
    user,
    password,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
