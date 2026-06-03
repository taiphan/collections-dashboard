CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'publish', 'delete', 'advance', 'send_back', 'reassign', 'approve', 'reject', 'resolve', 'comment_post', 'comment_delete', 'attachment_upload', 'attachment_delete');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('active', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."email_state" AS ENUM('none', 'queued', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('assignment', 'sla_warning', 'sla_breach', 'reassignment', 'send_back', 'mention', 'comment_reply');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"uploader_user_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"artifact_type" text NOT NULL,
	"artifact_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"before_ref" text,
	"after_ref" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"from_stage_id" text,
	"to_stage_id" text,
	"from_step_id" text,
	"to_step_id" text,
	"action" "audit_action" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_type_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_type_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"primary_entity_id" uuid NOT NULL,
	"published_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_type_id" uuid NOT NULL,
	"case_type_version" integer NOT NULL,
	"identifier" text NOT NULL,
	"status" "case_status" DEFAULT 'active' NOT NULL,
	"current_stage_id" text NOT NULL,
	"current_step_id" text NOT NULL,
	"current_assignee_user_id" uuid,
	"current_assignee_role" text,
	"stage_entered_at" timestamp with time zone NOT NULL,
	"case_entered_at" timestamp with time zone NOT NULL,
	"primary_entity_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"mentions" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"published_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"published_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"roles" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"email_prefs" jsonb DEFAULT '{"assignments":true,"sla":true,"mentions":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"case_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"email_state" "email_state" DEFAULT 'none' NOT NULL,
	"email_attempts" integer DEFAULT 0 NOT NULL,
	"email_next_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subdomain" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_user_id_users_id_fk" FOREIGN KEY ("uploader_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_history" ADD CONSTRAINT "case_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_history" ADD CONSTRAINT "case_history_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_history" ADD CONSTRAINT "case_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type_versions" ADD CONSTRAINT "case_type_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type_versions" ADD CONSTRAINT "case_type_versions_case_type_id_case_types_id_fk" FOREIGN KEY ("case_type_id") REFERENCES "public"."case_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type_versions" ADD CONSTRAINT "case_type_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_types" ADD CONSTRAINT "case_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_types" ADD CONSTRAINT "case_types_primary_entity_id_entities_id_fk" FOREIGN KEY ("primary_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_case_type_id_case_types_id_fk" FOREIGN KEY ("case_type_id") REFERENCES "public"."case_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_current_assignee_user_id_users_id_fk" FOREIGN KEY ("current_assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_tenant_case_idx" ON "attachments" USING btree ("tenant_id","case_id");--> statement-breakpoint
CREATE INDEX "audit_log_tenant_artifact_idx" ON "audit_log" USING btree ("tenant_id","artifact_type","artifact_id","occurred_at");--> statement-breakpoint
CREATE INDEX "case_history_tenant_case_idx" ON "case_history" USING btree ("tenant_id","case_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "case_type_versions_unique" ON "case_type_versions" USING btree ("case_type_id","version");--> statement-breakpoint
CREATE INDEX "case_type_versions_tenant_idx" ON "case_type_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_types_tenant_name_unique" ON "case_types" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "case_types_tenant_idx" ON "case_types" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cases_tenant_identifier_unique" ON "cases" USING btree ("tenant_id","identifier");--> statement-breakpoint
CREATE INDEX "cases_tenant_status_type_idx" ON "cases" USING btree ("tenant_id","status","case_type_id");--> statement-breakpoint
CREATE INDEX "cases_tenant_assignee_idx" ON "cases" USING btree ("tenant_id","current_assignee_user_id");--> statement-breakpoint
CREATE INDEX "cases_tenant_keyset_idx" ON "cases" USING btree ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "comments_tenant_case_idx" ON "comments" USING btree ("tenant_id","case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "entities_tenant_name_unique" ON "entities" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "entities_tenant_idx" ON "entities" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_versions_unique" ON "entity_versions" USING btree ("entity_id","version");--> statement-breakpoint
CREATE INDEX "entity_versions_tenant_idx" ON "entity_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_versions_unique" ON "form_versions" USING btree ("form_id","version");--> statement-breakpoint
CREATE INDEX "form_versions_tenant_idx" ON "form_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forms_tenant_name_unique" ON "forms" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "forms_tenant_entity_idx" ON "forms" USING btree ("tenant_id","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_tenant_user_unique" ON "memberships" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "notifications_tenant_recipient_idx" ON "notifications" USING btree ("tenant_id","recipient_user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notifications_email_queue_idx" ON "notifications" USING btree ("email_state","email_next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_subdomain_unique" ON "tenants" USING btree ("subdomain");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");