const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { sql } = require('drizzle-orm');

async function test() {
  const pool = new Pool({
    connectionString: 'postgres://localhost/postgres', // just to parse
  });
  const db = drizzle(pool);
  
  const ids = [1, 2, 3];
  const query = sql`SELECT * FROM qc_results WHERE lot_id IN (${sql.join(ids, sql`, `)})`;
  
  try {
    const res = db.$client.query(query.toQuery({ escapeName: () => '', escapeParam: (i) => '$' + i, escapeString: () => '' }));
    console.log(res);
  } catch(e) {
    console.log("Failed to build:", e.message);
  }
}
test();
