import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema } from '@/lib/db/schema';

declare global {
  var __lcp_pool: Pool | undefined;
  var __lcp_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and start Postgres with `npm run db:up`.',
    );
  }
  return url;
}

/**
 * Pool is cached on `globalThis` to survive Next.js dev server hot-reloads
 * without leaking connections.
 */
export function getPool(): Pool {
  if (!globalThis.__lcp_pool) {
    globalThis.__lcp_pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: Number(process.env.DB_POOL_SIZE ?? 10),
    });
  }
  return globalThis.__lcp_pool;
}

export function getDb() {
  if (!globalThis.__lcp_db) {
    globalThis.__lcp_db = drizzle(getPool(), { schema });
  }
  return globalThis.__lcp_db;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
