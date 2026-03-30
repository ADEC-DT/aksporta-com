CREATE TABLE IF NOT EXISTS "departments" (
	"internal_id" integer PRIMARY KEY NOT NULL,
	"external_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"inactive" boolean DEFAULT false NOT NULL,
	"budget_owner_id" varchar,
	"parent_id" integer,
	CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("internal_id")
);
