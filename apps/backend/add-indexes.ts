import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  const queries = [
    `CREATE INDEX IF NOT EXISTS "idx_alerts_result_id" ON "alerts" USING btree ("result_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_tests_machine_id" ON "qc_tests" USING btree ("machine_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_machines_section_id" ON "machines" USING btree ("section_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_results_run_id" ON "qc_results" USING btree ("run_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_results_lot_id" ON "qc_results" USING btree ("lot_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_results_lot_id_id" ON "qc_results" USING btree ("lot_id","id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_runs_machine_id" ON "qc_runs" USING btree ("machine_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_runs_test_id" ON "qc_runs" USING btree ("test_id");`,
    `CREATE INDEX IF NOT EXISTS "idx_qc_runs_run_date" ON "qc_runs" USING btree ("run_date");`,
    `CREATE INDEX IF NOT EXISTS "idx_control_lots_test_id" ON "control_lots" USING btree ("test_id");`
  ];

  for (const q of queries) {
    console.log('Running:', q);
    await sql.query(q);
  }
  console.log('Done');
}

run().catch(console.error);
