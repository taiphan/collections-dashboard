/**
 * Plain-JS migration runner for production containers (no tsx needed).
 *
 * Applies every .sql file in ./drizzle in lexical order, splitting on the
 * Drizzle `--> statement-breakpoint` marker. Idempotent migrations (IF NOT
 * EXISTS / OR REPLACE) make re-runs safe.
 *
 * Usage: node scripts/migrate.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const dir = path.resolve(process.cwd(), 'drizzle');

async function main() {
  const entries = await readdir(dir);
  const files = entries.filter((e) => e.endsWith('.sql')).sort((a, b) => a.localeCompare(b));
  const pool = new pg.Pool({ connectionString: url });

  // Track applied migrations so re-runs skip completed files.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS _lcp_migrations (
       tag text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );

  for (const file of files) {
    const tag = file.replace(/\.sql$/, '');
    const { rows } = await pool.query('SELECT 1 FROM _lcp_migrations WHERE tag = $1', [tag]);
    if (rows.length > 0) {
      console.log(`skip   ${tag}`);
      continue;
    }
    const sql = await readFile(path.join(dir, file), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const statement of statements) {
        await client.query(statement);
      }
      await client.query('INSERT INTO _lcp_migrations (tag) VALUES ($1)', [tag]);
      await client.query('COMMIT');
      console.log(`apply  ${tag}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`failed ${tag}:`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('migrations complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
