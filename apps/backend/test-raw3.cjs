const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/qc_project' });
pool.query('SELECT * FROM qc_tests WHERE machine_id = 22', (err, res) => {
  console.log('Tests for Machine 22:', err ? err : res.rows);
  pool.query('SELECT * FROM qc_tests ORDER BY id DESC LIMIT 5', (err2, res2) => {
    console.log('Latest 5 tests:', err2 ? err2 : res2.rows);
    pool.query('SELECT * FROM control_lots ORDER BY id DESC LIMIT 5', (err3, res3) => {
      console.log('Latest 5 control lots:', err3 ? err3 : res3.rows);
      pool.end();
    });
  });
});
