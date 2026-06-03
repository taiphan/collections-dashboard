import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { withTenant } from '@/lib/db/repositories/base';
import { getDb } from '@/lib/db/client';
import { caseTypeVersions } from '@/lib/db/schema';
import * as caseRepo from '@/lib/db/repositories/cases';
import * as caseTypeRepo from '@/lib/db/repositories/case-types';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import {
  computeStatus,
  type SlaStatus,
} from '@/lib/services/sla-engine';
import type { CaseTypeDefinition } from '@/lib/validation/case-type';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    caseTypeId?: string;
    stageId?: string;
    status?: 'active' | 'resolved' | 'cancelled';
    assigneeUserId?: string;
    q?: string;
    sla?: 'on_track' | 'warning' | 'breached';
    cursor?: string;
  }>;
}

interface WorklistRow {
  id: string;
  identifier: string;
  caseTypeId: string;
  caseTypeVersion: number;
  status: caseRepo.CaseStatus;
  currentStageId: string;
  currentStepId: string;
  currentAssigneeUserId: string | null;
  currentAssigneeRole: string | null;
  stageEnteredAt: Date;
  updatedAt: Date;
  slaStatus: SlaStatus | null;
}

const SLA_BADGE: Record<SlaStatus, string> = {
  on_track:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning:
    'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  breached: 'border-destructive/40 bg-destructive/10 text-destructive',
};

function decodeCursor(raw: string | undefined): caseRepo.WorklistCursor | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }
}

function encodeCursor(cursor: caseRepo.WorklistCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Resolve the SLA spec applicable to a row's current stage. Pulls all referenced
 * case-type-versions in one query so we don't N+1 across the page.
 */
async function computeSlaForRows(
  tenantId: string,
  rows: caseRepo.CaseRow[],
): Promise<Map<string, SlaStatus | null>> {
  if (rows.length === 0) return new Map();
  const db = getDb();
  // Pull every (caseTypeId, version) the page references.
  const versionKeys = Array.from(
    new Set(rows.map((r) => `${r.caseTypeId}:${r.caseTypeVersion}`)),
  );
  const defs = new Map<string, CaseTypeDefinition>();
  await Promise.all(
    versionKeys.map(async (key) => {
      const [caseTypeId, vStr] = key.split(':');
      const version = Number(vStr);
      const found = await db
        .select({ definition: caseTypeVersions.definition })
        .from(caseTypeVersions)
        .where(
          and(
            eq(caseTypeVersions.tenantId, tenantId),
            eq(caseTypeVersions.caseTypeId, caseTypeId!),
            eq(caseTypeVersions.version, version),
          ),
        )
        .limit(1);
      const def = found[0]?.definition as CaseTypeDefinition | undefined;
      if (def) defs.set(key, def);
    }),
  );

  const result = new Map<string, SlaStatus | null>();
  for (const r of rows) {
    const def = defs.get(`${r.caseTypeId}:${r.caseTypeVersion}`);
    const stage = def?.stages.find((s) => s.id === r.currentStageId);
    const sla = stage?.sla ?? def?.sla;
    result.set(r.id, sla ? computeStatus({ stageEnteredAt: r.stageEnteredAt, sla }) : null);
  }
  return result;
}

function preserveQuery(
  current: Awaited<PageProps['searchParams']>,
  override: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v != null && v !== '') params.set(k, v);
  }
  for (const [k, v] of Object.entries(override)) {
    if (v == null || v === '') params.delete(k);
    else params.set(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export default async function WorklistPage({ searchParams }: PageProps) {
  const ctx = await requireTenantContext();
  const sp = await searchParams;
  const q = withTenant(ctx.tenantId);

  // Pull case types in this tenant for the filter dropdown.
  const caseTypeSummaries = await caseTypeRepo.listCaseTypes(q);

  // Derive available stage ids from the published version of the selected
  // case type, when one is selected.
  let stageOptions: Array<{ id: string; name: string }> = [];
  if (sp.caseTypeId) {
    const head = caseTypeSummaries.find((c) => c.id === sp.caseTypeId);
    if (head?.publishedVersion != null) {
      const v = await caseTypeRepo.getCaseTypeVersion(q, head.id, head.publishedVersion);
      const def = v?.definition as CaseTypeDefinition | undefined;
      stageOptions = def?.stages.map((s) => ({ id: s.id, name: s.name })) ?? [];
    }
  }

  const page = await caseRepo.listForWorklist(q, {
    filters: {
      caseTypeId: sp.caseTypeId,
      status: sp.status,
      currentStageId: sp.stageId,
      currentAssigneeUserId: sp.assigneeUserId,
      identifierContains: sp.q,
    },
    cursor: decodeCursor(sp.cursor),
    limit: 50,
  });

  const slaByCaseId = await computeSlaForRows(ctx.tenantId, page.rows);

  // Apply SLA filter post-compute (deliberate: SLA is derived, not a column).
  let rows: WorklistRow[] = page.rows.map((r) => ({
    id: r.id,
    identifier: r.identifier,
    caseTypeId: r.caseTypeId,
    caseTypeVersion: r.caseTypeVersion,
    status: r.status,
    currentStageId: r.currentStageId,
    currentStepId: r.currentStepId,
    currentAssigneeUserId: r.currentAssigneeUserId,
    currentAssigneeRole: r.currentAssigneeRole,
    stageEnteredAt: r.stageEnteredAt,
    updatedAt: r.updatedAt,
    slaStatus: slaByCaseId.get(r.id) ?? null,
  }));
  if (sp.sla) {
    rows = rows.filter((r) => r.slaStatus === sp.sla);
  }

  return (
    <AppShell active="worklist">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Worklist</h1>
          <Link
            href="/cases/new"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New case
          </Link>
        </div>

        {/* ---- Filter bar (server-side GET form) ---- */}
        <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3" method="get">
          <FilterField label="Case type">
            <select
              name="caseTypeId"
              defaultValue={sp.caseTypeId ?? ''}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              {caseTypeSummaries.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Stage">
            <select
              name="stageId"
              defaultValue={sp.stageId ?? ''}
              disabled={stageOptions.length === 0}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm disabled:opacity-50"
            >
              <option value="">All</option>
              {stageOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Status">
            <select
              name="status"
              defaultValue={sp.status ?? ''}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FilterField>

          <FilterField label="SLA">
            <select
              name="sla"
              defaultValue={sp.sla ?? ''}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="breached">Breached</option>
              <option value="warning">Warning</option>
              <option value="on_track">On track</option>
            </select>
          </FilterField>

          <FilterField label="Search id">
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ''}
              placeholder="CASE-2026-…"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </FilterField>

          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Apply
          </button>
          {Object.values(sp).some(Boolean) ? (
            <Link
              href="/worklist"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {/* ---- Results ---- */}
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {Object.values(sp).some(Boolean)
              ? 'No cases match the current filters.'
              : 'No cases yet. Once an App Designer publishes a case type, you can create one here.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Case</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Step</th>
                  <th className="px-3 py-2">Assignee</th>
                  <th className="px-3 py-2">SLA</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link
                        href={`/cases/${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.identifier}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.currentStageId}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.currentStepId}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {c.currentAssigneeUserId ?? c.currentAssigneeRole ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {c.slaStatus ? (
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${SLA_BADGE[c.slaStatus]}`}
                        >
                          {c.slaStatus.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{c.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {c.updatedAt.toISOString().slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- Pagination (cursor-based) ---- */}
        {page.nextCursor ? (
          <div className="flex justify-end">
            <Link
              href={`/worklist${preserveQuery(sp, { cursor: encodeCursor(page.nextCursor) })}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
            >
              Next page →
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
