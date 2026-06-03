-- Append-only audit log enforcement (Property 3 / Requirement 10.3).
-- The trigger raises on any UPDATE or DELETE against audit_log, regardless of
-- which user, transaction, or session attempts the change.

CREATE OR REPLACE FUNCTION audit_log_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is not permitted.', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
--> statement-breakpoint
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
--> statement-breakpoint
CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
