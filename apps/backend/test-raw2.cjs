const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://admin:password@localhost:5432/qc_db' });
pool.query('SELECT * FROM qc_tests WHERE machine_id = 22', (err, res) => {
  console.log(err ? err : res.rows);
  pool.end();
});
