/**
 * Case type repo. Tenant-scoped.
 */

import { and, asc, eq } from 'drizzle-orm';
import { caseTypes, caseTypeVersions } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface CaseTypeRow {
  id: string;
  tenantId: string;
  name: string;
  label: string;
  primaryEntityId: string;
  publishedVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseTypeVersionRow {
  id: string;
  tenantId: string;
  caseTypeId: string;
  version: number;
  definition: unknown;
  createdBy: string;
  createdAt: Date;
}

export async function listCaseTypes(q: TenantQuery): Promise<CaseTypeRow[]> {
  return q.db
    .select()
    .from(caseTypes)
    .where(eq(caseTypes.tenantId, q.tenantId))
    .orderBy(asc(caseTypes.name));
}

export async function getCaseType(q: TenantQuery, id: string): Promise<CaseTypeRow | null> {
  const rows = await q.db
    .select()
    .from(caseTypes)
    .where(and(eq(caseTypes.tenantId, q.tenantId), eq(caseTypes.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCaseTypeByName(
  q: TenantQuery,
  name: string,
): Promise<CaseTypeRow | null> {
  const rows = await q.db
    .select()
    .from(caseTypes)
    .where(and(eq(caseTypes.tenantId, q.tenantId), eq(caseTypes.name, name)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCaseType(
  q: TenantQuery,
  input: {
    name: string;
    label: string;
    primaryEntityId: string;
    definition: unknown;
    createdBy: string;
  },
): Promise<{ caseType: CaseTypeRow; version: CaseTypeVersionRow }> {
  return q.db.transaction(async (tx) => {
    const [caseType] = await tx
      .insert(caseTypes)
      .values({
        tenantId: q.tenantId,
        name: input.name,
        label: input.label,
        primaryEntityId: input.primaryEntityId,
      })
      .returning();
    const [version] = await tx
      .insert(caseTypeVersions)
      .values({
        tenantId: q.tenantId,
        caseTypeId: caseType!.id,
        version: 1,
        definition: input.definition as object,
        createdBy: input.createdBy,
      })
      .returning();
    return {
      caseType: caseType!,
      version: { ...version!, definition: version!.definition as unknown },
    };
  });
}

export async function appendCaseTypeVersion(
  q: TenantQuery,
  input: { caseTypeId: string; definition: unknown; createdBy: string },
): Promise<CaseTypeVersionRow> {
  return q.db.transaction(async (tx) => {
    const [latest] = await tx
      .select({ version: caseTypeVersions.version })
      .from(caseTypeVersions)
      .where(
        and(
          eq(caseTypeVersions.tenantId, q.tenantId),
          eq(caseTypeVersions.caseTypeId, input.caseTypeId),
        ),
      )
      .orderBy(asc(caseTypeVersions.version));
    const nextVersion = (latest?.version ?? 0) + 1;
    const [version] = await tx
      .insert(caseTypeVersions)
      .values({
        tenantId: q.tenantId,
        caseTypeId: input.caseTypeId,
        version: nextVersion,
        definition: input.definition as object,
        createdBy: input.createdBy,
      })
      .returning();
    await tx
      .update(caseTypes)
      .set({ updatedAt: new Date() })
      .where(and(eq(caseTypes.tenantId, q.tenantId), eq(caseTypes.id, input.caseTypeId)));
    return { ...version!, definition: version!.definition as unknown };
  });
}

export async function publishCaseType(
  q: TenantQuery,
  caseTypeId: string,
  version: number,
): Promise<void> {
  await q.db
    .update(caseTypes)
    .set({ publishedVersion: version, updatedAt: new Date() })
    .where(and(eq(caseTypes.tenantId, q.tenantId), eq(caseTypes.id, caseTypeId)));
}

export async function getCaseTypeVersion(
  q: TenantQuery,
  caseTypeId: string,
  version: number,
): Promise<CaseTypeVersionRow | null> {
  const rows = await q.db
    .select()
    .from(caseTypeVersions)
    .where(
      and(
        eq(caseTypeVersions.tenantId, q.tenantId),
        eq(caseTypeVersions.caseTypeId, caseTypeId),
        eq(caseTypeVersions.version, version),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, definition: row.definition as unknown };
}

export async function listVersions(
  q: TenantQuery,
  caseTypeId: string,
): Promise<CaseTypeVersionRow[]> {
  const rows = await q.db
    .select()
    .from(caseTypeVersions)
    .where(
      and(
        eq(caseTypeVersions.tenantId, q.tenantId),
        eq(caseTypeVersions.caseTypeId, caseTypeId),
      ),
    )
    .orderBy(asc(caseTypeVersions.version));
  return rows.map((r) => ({ ...r, definition: r.definition as unknown }));
}
