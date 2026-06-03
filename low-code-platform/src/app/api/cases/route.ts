import { withCtx } from '@/lib/api/handler';
import { withTenant } from '@/lib/db/repositories/base';
import * as caseRepo from '@/lib/db/repositories/cases';
import * as runtime from '@/lib/services/case-runtime';
import type { WorklistFilters, WorklistCursor } from '@/lib/db/repositories/cases';

export const GET = withCtx(async ({ ctx, req }) => {
  const url = new URL(req.url);
  const filters: WorklistFilters = {
    caseTypeId: url.searchParams.get('caseTypeId') ?? undefined,
    status: (url.searchParams.get('status') as WorklistFilters['status']) ?? undefined,
    currentStageId: url.searchParams.get('stageId') ?? undefined,
    currentAssigneeUserId: url.searchParams.get('assigneeUserId') ?? undefined,
    identifierContains: url.searchParams.get('q') ?? undefined,
  };
  const cursorParam = url.searchParams.get('cursor');
  let cursor: WorklistCursor | undefined;
  if (cursorParam) {
    try {
      cursor = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf8'));
    } catch {
      // Ignore malformed cursors; treat as a fresh page.
    }
  }
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const q = withTenant(ctx.tenantId);
  const page = await caseRepo.listForWorklist(q, { filters, cursor, limit });
  return {
    rows: page.rows,
    nextCursor: page.nextCursor
      ? Buffer.from(JSON.stringify(page.nextCursor)).toString('base64')
      : null,
  };
});

export const POST = withCtx(async ({ ctx, req }) => {
  const body = (await req.json()) as { caseTypeId: string; initialData?: Record<string, unknown> };
  return runtime.createCase(ctx, body);
});
