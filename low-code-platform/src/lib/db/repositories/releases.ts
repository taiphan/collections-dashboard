/**
 * Releases repo. Tenant-scoped. (Pillar V2.H)
 */

import { and, desc, eq } from 'drizzle-orm';
import { releases, releaseApprovals } from '@/lib/db/schema';
import type { TenantQuery } from './base';

export interface ReleaseManifestArtifact {
  artifactType: 'entity' | 'form' | 'case_type' | 'decision_table';
  /** Source artifact id in the originating tenant. */
  sourceId: string;
  /** Source name; promotion uses name as the identity in the target tenant. */
  name: string;
  label: string;
  version: number;
  /** Captured definition snapshot. */
  definition: unknown;
}

export interface ReleaseManifest {
  artifacts: ReleaseManifestArtifact[];
  notes?: string;
}

export type ApprovalPolicy = 'none' | 'single' | 'dual';
export type ReleaseStatus = 'draft' | 'approved' | 'promoted';

export interface ReleaseRow {
  id: string;
  tenantId: string;
  name: string;
  manifest: ReleaseManifest;
  approvalPolicy: ApprovalPolicy;
  status: ReleaseStatus;
  createdBy: string;
  createdAt: Date;
}

export interface ReleaseApprovalRow {
  id: string;
  tenantId: string;
  releaseId: string;
  approverUserId: string;
  decision: 'approve' | 'reject';
  comment: string | null;
  createdAt: Date;
}

export async function list(q: TenantQuery): Promise<ReleaseRow[]> {
  const rows = await q.db
    .select()
    .from(releases)
    .where(eq(releases.tenantId, q.tenantId))
    .orderBy(desc(releases.createdAt));
  return rows.map((r) => ({
    ...r,
    manifest: r.manifest as ReleaseManifest,
    approvalPolicy: r.approvalPolicy as ApprovalPolicy,
    status: r.status as ReleaseStatus,
  }));
}

export async function getById(q: TenantQuery, id: string): Promise<ReleaseRow | null> {
  const rows = await q.db
    .select()
    .from(releases)
    .where(and(eq(releases.tenantId, q.tenantId), eq(releases.id, id)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    manifest: row.manifest as ReleaseManifest,
    approvalPolicy: row.approvalPolicy as ApprovalPolicy,
    status: row.status as ReleaseStatus,
  };
}

export async function create(
  q: TenantQuery,
  input: {
    name: string;
    manifest: ReleaseManifest;
    approvalPolicy: ApprovalPolicy;
    createdBy: string;
  },
): Promise<ReleaseRow> {
  const [row] = await q.db
    .insert(releases)
    .values({
      tenantId: q.tenantId,
      name: input.name,
      manifest: input.manifest as object,
      approvalPolicy: input.approvalPolicy,
      createdBy: input.createdBy,
    })
    .returning();
  return {
    ...row!,
    manifest: row!.manifest as ReleaseManifest,
    approvalPolicy: row!.approvalPolicy as ApprovalPolicy,
    status: row!.status as ReleaseStatus,
  };
}

export async function setStatus(
  q: TenantQuery,
  id: string,
  status: ReleaseStatus,
): Promise<void> {
  await q.db
    .update(releases)
    .set({ status })
    .where(and(eq(releases.tenantId, q.tenantId), eq(releases.id, id)));
}

export async function recordApproval(
  q: TenantQuery,
  input: {
    releaseId: string;
    approverUserId: string;
    decision: 'approve' | 'reject';
    comment?: string;
  },
): Promise<ReleaseApprovalRow> {
  const [row] = await q.db
    .insert(releaseApprovals)
    .values({
      tenantId: q.tenantId,
      releaseId: input.releaseId,
      approverUserId: input.approverUserId,
      decision: input.decision,
      comment: input.comment ?? null,
    })
    .onConflictDoUpdate({
      target: [releaseApprovals.releaseId, releaseApprovals.approverUserId],
      set: { decision: input.decision, comment: input.comment ?? null, createdAt: new Date() },
    })
    .returning();
  return { ...row!, decision: row!.decision as 'approve' | 'reject' };
}

export async function listApprovals(
  q: TenantQuery,
  releaseId: string,
): Promise<ReleaseApprovalRow[]> {
  const rows = await q.db
    .select()
    .from(releaseApprovals)
    .where(and(eq(releaseApprovals.tenantId, q.tenantId), eq(releaseApprovals.releaseId, releaseId)));
  return rows.map((r) => ({ ...r, decision: r.decision as 'approve' | 'reject' }));
}
