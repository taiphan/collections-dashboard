/**
 * Manager Dashboard service. Implements Requirement 15.
 *
 * Aggregates the three tile values for a tenant in a small number of SQL
 * round-trips. Tile values are scoped to active cases only.
 */

import { and, eq, sql } from 'drizzle-orm';
import { withTenant } from '@/lib/db/repositories/base';
import { cases, caseTypes, caseTypeVersions } from '@/lib/db/schema';
import { ROLES, requireAnyRole } from '@/lib/rbac/roles';
import { computeStatus, type SlaStatus } from '@/lib/services/sla-engine';
import type { TenantContext } from '@/lib/tenancy/types';
import type { CaseTypeDefinition } from '@/lib/validation/case-type';

export interface DashboardTileSegment<TKey> {
  key: TKey;
  label: string;
  count: number;
}

export interface DashboardSnapshot {
  cardsPerStage: DashboardTileSegment<{ caseTypeId: string; stageId: string }>[];
  cardsPerSla: DashboardTileSegment<SlaStatus>[];
  cardsPerAssignee: DashboardTileSegment<{ userId: string }>[];
  generatedAt: string;
}

export async function getDashboard(ctx: TenantContext): Promise<DashboardSnapshot> {
  requireAnyRole(ctx, [ROLES.MANAGER, ROLES.PLATFORM_ADMIN]);
  const q = withTenant(ctx.tenantId);

  // Cards per stage (scoped to active cases).
  const stageRows = await q.db
    .select({
      caseTypeId: cases.caseTypeId,
      stageId: cases.currentStageId,
      count: sql<number>`count(*)::int`,
    })
    .from(cases)
    .where(and(eq(cases.tenantId, ctx.tenantId), eq(cases.status, 'active')))
    .groupBy(cases.caseTypeId, cases.currentStageId);

  // Cards per assignee.
  const assigneeRows = await q.db
    .select({
      userId: cases.currentAssigneeUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(cases)
    .where(and(eq(cases.tenantId, ctx.tenantId), eq(cases.status, 'active')))
    .groupBy(cases.currentAssigneeUserId);

  // SLA distribution: we need each case's stage SLA spec to compute status.
  // Pull active cases with their pinned stage's SLA via a join on
  // case_type_versions.
  const slaSourceRows = await q.db
    .select({
      caseId: cases.id,
      stageEnteredAt: cases.stageEnteredAt,
      currentStageId: cases.currentStageId,
      definition: caseTypeVersions.definition,
    })
    .from(cases)
    .innerJoin(
      caseTypeVersions,
      and(
        eq(caseTypeVersions.caseTypeId, cases.caseTypeId),
        eq(caseTypeVersions.version, cases.caseTypeVersion),
        eq(caseTypeVersions.tenantId, cases.tenantId),
      ),
    )
    .where(and(eq(cases.tenantId, ctx.tenantId), eq(cases.status, 'active')));

  const slaCounts: Record<SlaStatus, number> = { on_track: 0, warning: 0, breached: 0 };
  for (const r of slaSourceRows) {
    const def = r.definition as CaseTypeDefinition;
    const stage = def.stages.find((s) => s.id === r.currentStageId);
    const sla = stage?.sla ?? def.sla;
    if (!sla) continue;
    const status = computeStatus({ stageEnteredAt: r.stageEnteredAt, sla });
    slaCounts[status]++;
  }

  // Resolve case-type names so the labels are pretty.
  const ctRows = await q.db
    .select({ id: caseTypes.id, name: caseTypes.name, label: caseTypes.label })
    .from(caseTypes)
    .where(eq(caseTypes.tenantId, ctx.tenantId));
  const ctById = new Map(ctRows.map((c) => [c.id, c]));

  return {
    cardsPerStage: stageRows.map((r) => ({
      key: { caseTypeId: r.caseTypeId, stageId: r.stageId },
      label: `${ctById.get(r.caseTypeId)?.label ?? 'Case'} · ${r.stageId}`,
      count: Number(r.count),
    })),
    cardsPerSla: (['breached', 'warning', 'on_track'] as SlaStatus[]).map((s) => ({
      key: s,
      label: s.replace('_', ' '),
      count: slaCounts[s],
    })),
    cardsPerAssignee: assigneeRows
      .filter((r) => r.userId !== null)
      .map((r) => ({
        key: { userId: r.userId as string },
        label: r.userId as string,
        count: Number(r.count),
      })),
    generatedAt: new Date().toISOString(),
  };
}
