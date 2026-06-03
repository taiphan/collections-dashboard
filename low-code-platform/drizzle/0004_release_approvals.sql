-- V2.H — release approval gate.
-- A release can require one or two approvers before promotion is allowed.

ALTER TABLE releases ADD COLUMN IF NOT EXISTS approval_policy text NOT NULL DEFAULT 'none';
--> statement-breakpoint
ALTER TABLE releases ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS release_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  approver_user_id uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS release_approvals_unique ON release_approvals(release_id, approver_user_id);
