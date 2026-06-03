CREATE TYPE "public"."machine_status_enum" AS ENUM('IDLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('TECHNICIAN', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."specialization_enum" AS ENUM('HEMATOLOGY', 'CHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('PASS', 'FAIL', 'WARNING');--> statement-breakpoint
CREATE TYPE "public"."user_alert_status_enum" AS ENUM('UNSEEN', 'SEEN', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text,
	"priority" "priority_enum" DEFAULT 'MEDIUM',
	"message" text,
	"rule_violated" varchar(50),
	"suggested_solution" text,
	"result_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "control_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"expiration_date" timestamp NOT NULL,
	"target_value" double precision,
	"mean" double precision,
	"standard_deviation" double precision,
	"upper_control_limit" double precision,
	"lower_control_limit" double precision,
	"upper_warning_limit" double precision,
	"lower_warning_limit" double precision,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hosp_code" text,
	"section_id" integer NOT NULL,
	"current_status" "machine_status_enum" DEFAULT 'IDLE',
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"specialization" "specialization_enum"
);
--> statement-breakpoint
CREATE TABLE "qc_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"measured_value" double precision NOT NULL,
	"z_score" double precision DEFAULT 0 NOT NULL,
	"violated_rule" varchar(50),
	"test_date" timestamp DEFAULT now(),
	"status" "status_enum" NOT NULL,
	"comments" text,
	"lot_id" integer NOT NULL,
	"performed_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_name" text NOT NULL,
	"test_type" text,
	"machine_id" integer NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"specialization" "specialization_enum" DEFAULT 'OTHER'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text,
	"role" "role_enum" DEFAULT 'TECHNICIAN' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_to_alerts" (
	"user_id" integer NOT NULL,
	"alert_id" integer NOT NULL,
	"status" "user_alert_status_enum" DEFAULT 'UNSEEN' NOT NULL,
	"seen_at" timestamp,
	"resolved_at" timestamp,
	"resolution_note" text,
	CONSTRAINT "users_to_alerts_user_id_alert_id_pk" PRIMARY KEY("user_id","alert_id")
);
--> statement-breakpoint
CREATE TABLE "users_to_sections" (
	"user_id" integer NOT NULL,
	"section_id" integer NOT NULL,
	CONSTRAINT "users_to_sections_user_id_section_id_pk" PRIMARY KEY("user_id","section_id")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_result_id_qc_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."qc_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_lots" ADD CONSTRAINT "control_lots_test_id_qc_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."qc_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_lot_id_control_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."control_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_tests" ADD CONSTRAINT "qc_tests_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_alerts" ADD CONSTRAINT "users_to_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_alerts" ADD CONSTRAINT "users_to_alerts_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_sections" ADD CONSTRAINT "users_to_sections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_sections" ADD CONSTRAINT "users_to_sections_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;