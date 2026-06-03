/**
 * Connectors repo. Tenant-scoped.
 */

import { and, asc, eq } from 'drizzle-orm';
import { connectors } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface ConnectorRow {
  id: string;
  tenantId: string;
  name: string;
  label: string;
  kind: string;
  config: Record<string, unknown>;
  credentialRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function rowToConnector(r: typeof connectors.$inferSelect): ConnectorRow {
  return { ...r, config: r.config as Record<string, unknown> };
}

export async function list(q: TenantQuery): Promise<ConnectorRow[]> {
  const rows = await q.db
    .select()
    .from(connectors)
    .where(eq(connectors.tenantId, q.tenantId))
    .orderBy(asc(connectors.name));
  return rows.map(rowToConnector);
}

export async function getById(q: TenantQuery, id: string): Promise<ConnectorRow | null> {
  const rows = await q.db
    .select()
    .from(connectors)
    .where(and(eq(connectors.tenantId, q.tenantId), eq(connectors.id, id)))
    .limit(1);
  return rows[0] ? rowToConnector(rows[0]) : null;
}

export async function create(
  q: TenantQuery,
  input: { name: string; label: string; kind: string; config: Record<string, unknown>; credentialRef?: string },
): Promise<ConnectorRow> {
  const [row] = await q.db
    .insert(connectors)
    .values({
      tenantId: q.tenantId,
      name: input.name,
      label: input.label,
      kind: input.kind,
      config: input.config,
      credentialRef: input.credentialRef ?? null,
    })
    .returning();
  return rowToConnector(row!);
}
