/**
 * Form repo. Tenant-scoped.
 */

import { and, asc, eq } from 'drizzle-orm';
import { forms, formVersions } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface FormRow {
  id: string;
  tenantId: string;
  name: string;
  label: string;
  entityId: string;
  publishedVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormVersionRow {
  id: string;
  tenantId: string;
  formId: string;
  version: number;
  definition: unknown;
  createdBy: string;
  createdAt: Date;
}

export async function listForms(q: TenantQuery): Promise<FormRow[]> {
  return q.db
    .select()
    .from(forms)
    .where(eq(forms.tenantId, q.tenantId))
    .orderBy(asc(forms.name));
}

export async function getForm(q: TenantQuery, id: string): Promise<FormRow | null> {
  const rows = await q.db
    .select()
    .from(forms)
    .where(and(eq(forms.tenantId, q.tenantId), eq(forms.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFormByName(q: TenantQuery, name: string): Promise<FormRow | null> {
  const rows = await q.db
    .select()
    .from(forms)
    .where(and(eq(forms.tenantId, q.tenantId), eq(forms.name, name)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createForm(
  q: TenantQuery,
  input: {
    name: string;
    label: string;
    entityId: string;
    definition: unknown;
    createdBy: string;
  },
): Promise<{ form: FormRow; version: FormVersionRow }> {
  return q.db.transaction(async (tx) => {
    const [form] = await tx
      .insert(forms)
      .values({
        tenantId: q.tenantId,
        name: input.name,
        label: input.label,
        entityId: input.entityId,
      })
      .returning();
    const [version] = await tx
      .insert(formVersions)
      .values({
        tenantId: q.tenantId,
        formId: form!.id,
        version: 1,
        definition: input.definition as object,
        createdBy: input.createdBy,
      })
      .returning();
    return {
      form: form!,
      version: { ...version!, definition: version!.definition as unknown },
    };
  });
}

export async function appendFormVersion(
  q: TenantQuery,
  input: { formId: string; definition: unknown; createdBy: string },
): Promise<FormVersionRow> {
  return q.db.transaction(async (tx) => {
    const [latest] = await tx
      .select({ version: formVersions.version })
      .from(formVersions)
      .where(
        and(
          eq(formVersions.tenantId, q.tenantId),
          eq(formVersions.formId, input.formId),
        ),
      )
      .orderBy(asc(formVersions.version));
    const nextVersion = (latest?.version ?? 0) + 1;
    const [version] = await tx
      .insert(formVersions)
      .values({
        tenantId: q.tenantId,
        formId: input.formId,
        version: nextVersion,
        definition: input.definition as object,
        createdBy: input.createdBy,
      })
      .returning();
    await tx
      .update(forms)
      .set({ updatedAt: new Date() })
      .where(and(eq(forms.tenantId, q.tenantId), eq(forms.id, input.formId)));
    return { ...version!, definition: version!.definition as unknown };
  });
}

export async function publishForm(
  q: TenantQuery,
  formId: string,
  version: number,
): Promise<void> {
  await q.db
    .update(forms)
    .set({ publishedVersion: version, updatedAt: new Date() })
    .where(and(eq(forms.tenantId, q.tenantId), eq(forms.id, formId)));
}

export async function getFormVersion(
  q: TenantQuery,
  formId: string,
  version: number,
): Promise<FormVersionRow | null> {
  const rows = await q.db
    .select()
    .from(formVersions)
    .where(
      and(
        eq(formVersions.tenantId, q.tenantId),
        eq(formVersions.formId, formId),
        eq(formVersions.version, version),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, definition: row.definition as unknown };
}

export async function listVersions(q: TenantQuery, formId: string): Promise<FormVersionRow[]> {
  const rows = await q.db
    .select()
    .from(formVersions)
    .where(and(eq(formVersions.tenantId, q.tenantId), eq(formVersions.formId, formId)))
    .orderBy(asc(formVersions.version));
  return rows.map((r) => ({ ...r, definition: r.definition as unknown }));
}
