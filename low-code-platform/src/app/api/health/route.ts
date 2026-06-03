import { getPool } from '@/lib/db/client';

/**
 * Liveness + readiness probe. Returns 200 when the process is up and the DB
 * answers a trivial query; 503 when the DB is unreachable. Public (allow-listed
 * in proxy.ts) so orchestrators can probe without auth.
 */
export async function GET(): Promise<Response> {
  try {
    await getPool().query('SELECT 1');
    return Response.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    return Response.json(
      { status: 'degraded', db: 'down', time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
