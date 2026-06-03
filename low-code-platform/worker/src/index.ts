/**
 * Worker entrypoint.
 *
 * Loops:
 *   - SLA sweep every SLA_INTERVAL_MS (default 30s)
 *   - Notification dispatch every NOTIFY_INTERVAL_MS (default 10s)
 *
 * Both loops use Postgres SKIP LOCKED so multiple replicas don't double-fire.
 */

import 'dotenv/config';
import { runSlaSweep } from './sla-poller.js';
import { dispatchOnce } from './notification-dispatcher.js';
import { pool } from './db.js';

const slaInterval = Number(process.env.SLA_INTERVAL_MS ?? 30_000);
const notifyInterval = Number(process.env.NOTIFY_INTERVAL_MS ?? 10_000);

let stopping = false;

async function loop(name: string, intervalMs: number, fn: () => Promise<unknown>): Promise<void> {
  while (!stopping) {
    try {
      await fn();
    } catch (err) {
      console.error(`[${name}] error:`, err);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

async function main(): Promise<void> {
  console.log('worker started');
  process.on('SIGTERM', () => {
    stopping = true;
  });
  process.on('SIGINT', () => {
    stopping = true;
  });
  await Promise.all([
    loop('sla', slaInterval, runSlaSweep),
    loop('notify', notifyInterval, () => dispatchOnce(25)),
  ]);
  await pool.end();
  console.log('worker stopped');
}

main().catch((err) => {
  console.error('worker crashed:', err);
  process.exit(1);
});
