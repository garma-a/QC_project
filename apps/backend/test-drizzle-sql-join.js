const { sql } = require('drizzle-orm');

try {
  const ids = [1, 2, 3];
  const query = sql`SELECT * FROM t WHERE id IN (${sql.join(ids, sql`, `)})`;
  console.log("SQL:", query.queryChunks);
} catch(e) {
  console.error("Error:", e.message);
}
