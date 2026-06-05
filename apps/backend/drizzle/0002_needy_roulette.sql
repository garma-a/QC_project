CREATE INDEX "idx_alerts_result_id" ON "alerts" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_created_at" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_control_lots_test_id" ON "control_lots" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_control_lots_test_id_is_active" ON "control_lots" USING btree ("test_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_machines_section_id" ON "machines" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_qc_results_run_id" ON "qc_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_qc_results_lot_id" ON "qc_results" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "idx_qc_results_lot_id_id" ON "qc_results" USING btree ("lot_id","id");--> statement-breakpoint
CREATE INDEX "idx_qc_runs_machine_id" ON "qc_runs" USING btree ("machine_id");--> statement-breakpoint
CREATE INDEX "idx_qc_runs_test_id" ON "qc_runs" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_qc_runs_run_date" ON "qc_runs" USING btree ("run_date");--> statement-breakpoint
CREATE INDEX "idx_qc_tests_machine_id" ON "qc_tests" USING btree ("machine_id");