-- V2.E connectors
CREATE TABLE IF NOT EXISTS connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credential_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS connectors_tenant_name_unique ON connectors(tenant_id, name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS decision_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  definition jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS decision_tables_tenant_name_unique ON decision_tables(tenant_id, name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  manifest jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS releases_tenant_name_unique ON releases(tenant_id, name);
