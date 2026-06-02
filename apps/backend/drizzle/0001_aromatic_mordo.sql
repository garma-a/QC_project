CREATE TABLE "qc_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"test_id" integer NOT NULL,
	"performed_by" integer NOT NULL,
	"run_date" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "qc_results" DROP CONSTRAINT "qc_results_performed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "qc_results" ADD COLUMN "z_score" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "qc_results" ALTER COLUMN "z_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "qc_results" ADD COLUMN "violated_rule" varchar(50);--> statement-breakpoint
ALTER TABLE "control_lots" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "qc_results" ADD COLUMN "run_id" integer;-->statement-breakpoint
-- Backfill: create a single default QC run and assign it to all pre-existing results
-- so that the NOT NULL + FK constraints can be applied without crashing.
DO $$
DECLARE
  _default_run_id integer;
  _fallback_user_id integer;
BEGIN
  IF EXISTS (SELECT 1 FROM "qc_results" WHERE "run_id" IS NULL LIMIT 1) THEN
    -- Resolve a valid user for performed_by (must exist if results exist)
    SELECT "id" INTO _fallback_user_id FROM "users" ORDER BY "id" LIMIT 1;
    IF _fallback_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot backfill qc_results: no users exist for performed_by';
    END IF;

    -- Resolve REAL machine_id via: qc_results → control_lots → qc_tests.machine_id
    INSERT INTO "qc_runs" ("machine_id", "test_id", "performed_by")
    SELECT qt."machine_id", qt."id", _fallback_user_id
    FROM "qc_results" qr
    JOIN "control_lots" cl ON cl."id" = qr."lot_id"
    JOIN "qc_tests" qt ON qt."id" = cl."test_id"
    WHERE qr."run_id" IS NULL
    LIMIT 1
    RETURNING "id" INTO _default_run_id;

    UPDATE "qc_results" SET "run_id" = _default_run_id WHERE "run_id" IS NULL;
  END IF;
END $$;-->statement-breakpoint
ALTER TABLE "qc_results" ALTER COLUMN "run_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_test_id_qc_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."qc_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_run_id_qc_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."qc_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" DROP COLUMN "test_date";--> statement-breakpoint
ALTER TABLE "qc_results" DROP COLUMN "performed_by";