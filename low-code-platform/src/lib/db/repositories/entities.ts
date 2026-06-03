/**
 * Entity (data model) repo. Tenant-scoped.
 */

import { and, asc, eq } from 'drizzle-orm';
import { entities, entityVersions } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface EntityRow {
  id: string;
  tenantId: string;
  name: string;
  label: string;
  publishedVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityVersionRow {
  id: string;
  tenantId: string;
  entityId: string;
  version: number;
  definition: unknown;
  createdBy: string;
  createdAt: Date;
}

export async function listEntities(q: TenantQuery): Promise<EntityRow[]> {
  return q.db
    .select()
    .from(entities)
    .where(eq(entities.tenantId, q.tenantId))
    .orderBy(asc(entities.name));
}

export async function getEntity(q: TenantQuery, id: string): Promise<EntityRow | null> {
  const rows = await q.db
    .select()
    .from(entities)
    .where(and(eq(entities.tenantId, q.tenantId), eq(entities.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getEntityByName(q: TenantQuery, name: string): Promise<EntityRow | null> {
  const rows = await q.db
    .select()
    .from(entities)
    .where(and(eq(entities.tenantId, q.tenantId), eq(entities.name, name)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createEntity(
  q: TenantQuery,
  input: { name: string; label: string; definition: unknown; createdBy: string },
): Promise<{ entity: EntityRow; version: EntityVersionRow }> {
  return q.db.transaction(async (tx) => {
    const [entity] = await tx
      .insert(entities)
      .values({ tenantId: q.tenantId, name: input.name, label: input.label })
      .returning();
    const [version] = await tx
      .insert(entityVersions)
      .values({
        tenantId: q.tenantId,
        entityId: entity!.id,
        version: 1,
        definition: input.definition as object,
        createdBy: input.createdBy,
      })
      .returning();
    return {
      entity: entity!,
      version: { ...version!, definition: version!.definition as unknown },
    };
  });
}

export async function appendEntityVersion(
  q: TenantQuery,
  input: { entityId: string; definition: unknown; createdBy: string },
): Promise<EntityVersionRow> {
  return q.db.transaction(async (tx) => {
    const [latest] = await tx
      .select({ version: entityVersions.version })
      .from(entityVersions)
      .where(
        and(
          eq(entityVersions.tenantId, q.tenantId),
          eq(entityVersions.entityId, input.entityId),
        ),
      )
      .orderBy(asc(entityVersions.version));
    const nextVersion = (latest?.version ?? 0) + 1;
    const [version] = await tx
      .insert(entityVersions)
      .values({
        tenantId: q.tenantId,
        entityId: input.entityId,
        version: nextVersion,
        definition: input.definition as object,
        createdBy: input.createdBy,
      })
      .returning();
    await tx
      .update(entities)
      .set({ updatedAt: new Date() })
      .where(and(eq(entities.tenantId, q.tenantId), eq(entities.id, input.entityId)));
    return { ...version!, definition: version!.definition as unknown };
  });
}

export async function publishEntity(
  q: TenantQuery,
  entityId: string,
  version: number,
): Promise<void> {
  await q.db
    .update(entities)
    .set({ publishedVersion: version, updatedAt: new Date() })
    .where(and(eq(entities.tenantId, q.tenantId), eq(entities.id, entityId)));
}

export async function getEntityVersion(
  q: TenantQuery,
  entityId: string,
  version: number,
): Promise<EntityVersionRow | null> {
  const rows = await q.db
    .select()
    .from(entityVersions)
    .where(
      and(
        eq(entityVersions.tenantId, q.tenantId),
        eq(entityVersions.entityId, entityId),
        eq(entityVersions.version, version),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, definition: row.definition as unknown };
}

export async function listVersions(q: TenantQuery, entityId: string): Promise<EntityVersionRow[]> {
  const rows = await q.db
    .select()
    .from(entityVersions)
    .where(
      and(eq(entityVersions.tenantId, q.tenantId), eq(entityVersions.entityId, entityId)),
    )
    .orderBy(asc(entityVersions.version));
  return rows.map((r) => ({ ...r, definition: r.definition as unknown }));
}
