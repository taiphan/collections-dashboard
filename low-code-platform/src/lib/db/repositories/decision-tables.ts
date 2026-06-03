/**
 * Decision tables repo. Tenant-scoped.
 */

import { and, asc, eq } from 'drizzle-orm';
import { decisionTables } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface DecisionTableRow {
  id: string;
  tenantId: string;
  name: string;
  label: string;
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export async function list(q: TenantQuery): Promise<DecisionTableRow[]> {
  const rows = await q.db
    .select()
    .from(decisionTables)
    .where(eq(decisionTables.tenantId, q.tenantId))
    .orderBy(asc(decisionTables.name));
  return rows.map((r) => ({ ...r, definition: r.definition as unknown }));
}

export async function getById(q: TenantQuery, id: string): Promise<DecisionTableRow | null> {
  const rows = await q.db
    .select()
    .from(decisionTables)
    .where(and(eq(decisionTables.tenantId, q.tenantId), eq(decisionTables.id, id)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, definition: row.definition as unknown };
}

export async function create(
  q: TenantQuery,
  input: { name: string; label: string; definition: unknown },
): Promise<DecisionTableRow> {
  const [row] = await q.db
    .insert(decisionTables)
    .values({
      tenantId: q.tenantId,
      name: input.name,
      label: input.label,
      definition: input.definition as object,
    })
    .returning();
  return { ...row!, definition: row!.definition as unknown };
}

export async function update(
  q: TenantQuery,
  id: string,
  patch: { label?: string; definition?: unknown },
): Promise<void> {
  const next: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.label != null) next.label = patch.label;
  if (patch.definition != null) next.definition = patch.definition;
  await q.db
    .update(decisionTables)
    .set(next)
    .where(and(eq(decisionTables.tenantId, q.tenantId), eq(decisionTables.id, id)));
}
