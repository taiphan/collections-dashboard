/**
 * SLA poller. Plain SQL via `pg` to avoid duplicating Drizzle's runtime
 * types between the app and the worker (they live in separate node_modules
 * trees and TypeScript treats them as distinct).
 */

import { pool } from './db.js';
import {
  computeStatus,
  type SlaStatus,
} from './sla.js';

interface CaseRow {
  case_id: string;
  tenant_id: string;
  identifier: string;
  stage_entered_at: Date;
  current_stage_id: string;
  current_assignee_user_id: string | null;
  definition: { stages: Array<{ id: string; sla?: { targetMinutes: number; warningMinutes?: number } }>; sla?: { targetMinutes: number; warningMinutes?: number } };
}

interface Membership {
  user_id: string;
  prefs: { sla?: boolean };
}

const lastFired = new Map<string, SlaStatus>();

export async function runSlaSweep(): Promise<void> {
  const { rows } = await pool.query<CaseRow>(
    `SELECT
       c.id AS case_id,
       c.tenant_id,
       c.identifier,
       c.stage_entered_at,
       c.current_stage_id,
       c.current_assignee_user_id,
       v.definition
     FROM cases c
     JOIN case_type_versions v
       ON v.case_type_id = c.case_type_id
      AND v.version = c.case_type_version
      AND v.tenant_id = c.tenant_id
     WHERE c.status = 'active'`,
  );

  for (const r of rows) {
    const def = r.definition;
    const stage = def.stages.find((s) => s.id === r.current_stage_id);
    const sla = stage?.sla ?? def.sla;
    if (!sla) continue;
    const status = computeStatus({ stageEnteredAt: r.stage_entered_at, sla });
    const previous = lastFired.get(r.case_id);
    if (status === previous) continue;
    if (status === 'on_track') {
      lastFired.set(r.case_id, status);
      continue;
    }

    const { rows: members } = await pool.query<Membership>(
      `SELECT user_id, email_prefs AS prefs FROM memberships WHERE tenant_id = $1`,
      [r.tenant_id],
    );

    const recipients = new Set<string>();
    if (r.current_assignee_user_id) recipients.add(r.current_assignee_user_id);
    for (const m of members) {
      if (m.prefs?.sla) recipients.add(m.user_id);
    }
    if (recipients.size === 0) {
      lastFired.set(r.case_id, status);
      continue;
    }
    const kind = status === 'warning' ? 'sla_warning' : 'sla_breach';

    const values: unknown[] = [];
    const placeholders: string[] = [];
    let p = 1;
    for (const userId of recipients) {
      placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, 'queued', now())`);
      values.push(
        r.tenant_id,
        userId,
        kind,
        r.case_id,
        JSON.stringify({ identifier: r.identifier, status }),
      );
    }
    await pool.query(
      `INSERT INTO notifications
        (tenant_id, recipient_user_id, kind, case_id, payload, email_state, email_next_attempt_at)
       VALUES ${placeholders.join(',')}`,
      values,
    );
    lastFired.set(r.case_id, status);
    console.log(`[sla] ${kind} for case ${r.identifier}`);
  }
}
