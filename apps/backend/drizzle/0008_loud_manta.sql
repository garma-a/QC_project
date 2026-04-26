CREATE INDEX "idx_machines_is_active" ON "machines" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_users_to_alerts_status" ON "users_to_alerts" USING btree ("status");