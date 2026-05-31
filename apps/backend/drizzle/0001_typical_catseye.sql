CREATE TABLE "qc_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"performed_by" integer NOT NULL,
	"run_date" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "qc_results" DROP CONSTRAINT "qc_results_performed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "qc_results" ALTER COLUMN "z_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "control_lots" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "qc_results" ADD COLUMN "run_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_run_id_qc_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."qc_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" DROP COLUMN "test_date";--> statement-breakpoint
ALTER TABLE "qc_results" DROP COLUMN "performed_by";