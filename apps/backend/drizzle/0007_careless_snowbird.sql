CREATE TABLE "whitelist_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(256) NOT NULL,
	"added_by" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "whitelist_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "whitelist_emails" ADD CONSTRAINT "whitelist_emails_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;