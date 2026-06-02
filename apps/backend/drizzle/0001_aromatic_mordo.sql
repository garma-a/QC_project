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
ALTER TABLE "qc_results" ADD COLUMN "run_id" integer;--> statement-breakpoint
-- Backfill: dynamically create qc_runs rows based on existing qc_results data
-- to preserve historical performed_by and test_date.
DO $$
DECLARE
  rec RECORD;
  _new_run_id integer;
BEGIN
  -- Group existing results by machine, test, performed_by, and test_date
  FOR rec IN 
    SELECT DISTINCT 
      qt."machine_id", 
      qt."id" AS test_id, 
      qr."performed_by", 
      qr."test_date"
    FROM "qc_results" qr
    JOIN "control_lots" cl ON cl."id" = qr."lot_id"
    JOIN "qc_tests" qt ON qt."id" = cl."test_id"
    WHERE qr."run_id" IS NULL
  LOOP
    -- Insert a corresponding run
    INSERT INTO "qc_runs" ("machine_id", "test_id", "performed_by", "run_date")
    VALUES (rec.machine_id, rec.test_id, rec.performed_by, rec.test_date)
    RETURNING "id" INTO _new_run_id;

    -- Map the new run_id back to the specific group of qc_results
    UPDATE "qc_results" qr
    SET "run_id" = _new_run_id
    FROM "control_lots" cl, "qc_tests" qt
    WHERE qr."lot_id" = cl."id"
      AND cl."test_id" = qt."id"
      AND qt."machine_id" = rec.machine_id
      AND qt."id" = rec.test_id
      AND qr."performed_by" = rec.performed_by
      AND qr."test_date" IS NOT DISTINCT FROM rec.test_date
      AND qr."run_id" IS NULL;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "qc_results" ALTER COLUMN "run_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_test_id_qc_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."qc_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_runs" ADD CONSTRAINT "qc_runs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_run_id_qc_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."qc_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" DROP COLUMN "test_date";--> statement-breakpoint
ALTER TABLE "qc_results" DROP COLUMN "performed_by";