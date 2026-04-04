CREATE TABLE IF NOT EXISTS "approval_matrix" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "from_amount" numeric NOT NULL,
  "to_amount" numeric NOT NULL,
  "approver_employee_code" varchar,
  "is_auto_approve" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
