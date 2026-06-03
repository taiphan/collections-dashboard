/**
 * Notification dispatcher. Pulls queued email notifications and sends them via
 * SMTP (MailHog in dev). Retries up to 3x with exponential backoff
 * (Requirement 13.8).
 */

import nodemailer from 'nodemailer';
import { pool } from './db.js';

const MAX_ATTEMPTS = 3;
const BACKOFF_MINUTES = [1, 5, 25];

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return transporter;
}

interface QueuedRow {
  id: string;
  tenant_id: string;
  recipient_user_id: string;
  kind: string;
  case_id: string | null;
  payload: Record<string, unknown>;
  email_attempts: number;
  email: string | null;
}

export async function dispatchOnce(batchSize = 25): Promise<number> {
  // Note: SKIP LOCKED requires the rows to be locked within a transaction.
  const client = await pool.connect();
  let dispatched = 0;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<QueuedRow>(
      `SELECT n.id, n.tenant_id, n.recipient_user_id, n.kind, n.case_id, n.payload, n.email_attempts, u.email
       FROM notifications n
       JOIN users u ON u.id = n.recipient_user_id
       WHERE n.email_state = 'queued'
         AND (n.email_next_attempt_at IS NULL OR n.email_next_attempt_at <= now())
       ORDER BY n.created_at ASC
       LIMIT $1
       FOR UPDATE OF n SKIP LOCKED`,
      [batchSize],
    );

    if (rows.length === 0) {
      await client.query('COMMIT');
      return 0;
    }

    const t = getTransporter();
    for (const row of rows) {
      if (!row.email) {
        await client.query(
          `UPDATE notifications SET email_state = 'failed', email_next_attempt_at = NULL WHERE id = $1`,
          [row.id],
        );
        continue;
      }
      try {
        await t.sendMail({
          from: process.env.EMAIL_FROM ?? 'no-reply@lcp.localhost',
          to: row.email,
          subject: subjectForKind(row.kind),
          text: bodyForKind(row.kind, row.payload),
        });
        await client.query(
          `UPDATE notifications SET email_state = 'sent', email_next_attempt_at = NULL WHERE id = $1`,
          [row.id],
        );
        dispatched++;
      } catch (err) {
        const attempts = (row.email_attempts ?? 0) + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await client.query(
            `UPDATE notifications SET email_state = 'failed', email_attempts = $2, email_next_attempt_at = NULL WHERE id = $1`,
            [row.id, attempts],
          );
          console.error('[email] giving up:', err);
        } else {
          const delay = BACKOFF_MINUTES[attempts - 1] ?? 25;
          await client.query(
            `UPDATE notifications
             SET email_attempts = $2, email_next_attempt_at = $3
             WHERE id = $1`,
            [row.id, attempts, new Date(Date.now() + delay * 60_000)],
          );
          console.warn('[email] retry scheduled:', err);
        }
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return dispatched;
}

function subjectForKind(kind: string): string {
  switch (kind) {
    case 'assignment':
      return 'A case has been assigned to you';
    case 'reassignment':
      return 'A case was reassigned';
    case 'send_back':
      return 'A case was sent back for rework';
    case 'sla_warning':
      return 'SLA warning';
    case 'sla_breach':
      return 'SLA breached';
    case 'mention':
    case 'comment_reply':
      return 'You were mentioned';
    default:
      return 'Notification';
  }
}

function bodyForKind(kind: string, payload: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`Type: ${kind}`);
  for (const [k, v] of Object.entries(payload ?? {})) {
    lines.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  }
  return lines.join('\n');
}
