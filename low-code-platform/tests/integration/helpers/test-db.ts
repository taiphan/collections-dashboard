/**
 * Test-DB helper. Starts a fresh Postgres container, applies every migration
 * in `drizzle/`, and exposes a tear-down. The Drizzle client is rebuilt to
 * point at the container before each test file runs.
 */

import { afterAll, beforeAll } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { schema } from '@/lib/db/schema';

let container: StartedPostgreSqlContainer | null = null;
let pool: Pool | null = null;

declare global {
  var __lcp_pool: Pool | undefined;
  var __lcp_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

async function applyMigrations(client: Pool): Promise<void> {
  const dir = path.resolve(process.cwd(), 'drizzle');
  const entries = await fs.readdir(dir);
  const sqlFiles = entries
    .filter((e) => e.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
  for (const file of sqlFiles) {
    const sql = await fs.readFile(path.join(dir, file), 'utf8');
    // Drizzle uses a `--> statement-breakpoint` marker to split statements;
    // splitting on it gives clean executable units for the trigger migration.
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const statement of statements) {
      await client.query(statement);
    }
  }
}

export function setupTestDatabase() {
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('lcp_test')
      .withUsername('lcp')
      .withPassword('lcp')
      .start();

    const url = container.getConnectionUri();
    process.env.DATABASE_URL = url;
    pool = new Pool({ connectionString: url, max: 5 });
    await applyMigrations(pool);

    // Repoint the singleton Drizzle client used by the application.
    globalThis.__lcp_pool = pool;
    globalThis.__lcp_db = drizzle(pool, { schema });
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    pool = null;
    globalThis.__lcp_pool = undefined;
    globalThis.__lcp_db = undefined;
    if (container) {
      await container.stop();
      container = null;
    }
  });
}

export function getTestPool(): Pool {
  if (!pool) throw new Error('Test pool not initialized.');
  return pool;
}
