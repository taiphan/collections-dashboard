import { notFound } from 'next/navigation';
import { requireTenantContext } from '@/lib/tenancy/context';
import * as runtime from '@/lib/services/case-runtime';
import { HttpError } from '@/lib/auth/errors';
import { hasRole, ROLES } from '@/lib/rbac/roles';
import { AppShell } from '@/components/shared/AppShell';
import { CaseFormStepClient } from '@/components/runtime/case-view/CaseFormStepClient';
import { CaseApprovalActions } from '@/components/runtime/case-view/CaseApprovalActions';
import { CaseManagerActions } from '@/components/runtime/case-view/CaseManagerActions';
import { CommentsPanel } from '@/components/runtime/case-view/CommentsPanel';
import { AttachmentsPanel } from '@/components/runtime/case-view/AttachmentsPanel';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const ctx = await requireTenantContext();
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof runtime.getCaseDetail>>;
  try {
    detail = await runtime.getCaseDetail(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }

  const currentStep = detail.definition.stages
    .flatMap((s) => s.steps)
    .find((s) => s.id === detail.case.currentStepId);

  const sendBacks =
    currentStep && (currentStep.kind === 'form_step' || currentStep.kind === 'approval_step')
      ? (currentStep.sendBack ?? []).map((s) => ({ id: s.id, label: s.label }))
      : [];
  const canManage = hasRole(ctx, ROLES.MANAGER) || hasRole(ctx, ROLES.PLATFORM_ADMIN);

  return (
    <AppShell active="worklist">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {detail.caseTypeName} · v{detail.case.caseTypeVersion}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">{detail.case.identifier}</h1>
          </div>
          <SlaBadge status={detail.slaStatus} />
        </div>

        <StageProgress
          stages={detail.definition.stages.map((s) => ({ id: s.id, name: s.name }))}
          currentStageId={detail.case.currentStageId}
        />

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Current step
          </h2>
          <p className="mt-1 text-base font-medium text-foreground">{currentStep?.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">Kind: {currentStep?.kind}</p>

          {currentStep?.kind === 'form_step' && detail.formForCurrentStep ? (
            <div className="mt-4">
              <CaseFormStepClient
                caseId={detail.case.id}
                definition={detail.formForCurrentStep}
                initialValues={detail.case.primaryEntityData}
              />
            </div>
          ) : null}

          {currentStep?.kind === 'approval_step' ? (
            <div className="mt-4">
              <CaseApprovalActions caseId={detail.case.id} />
            </div>
          ) : null}

          {currentStep?.kind === 'automated_step' ? (
            <p className="mt-3 text-sm text-muted-foreground">
              This step runs automatically. The case will advance on its own.
            </p>
          ) : null}

          {currentStep?.kind === 'notification_step' ? (
            <p className="mt-3 text-sm text-muted-foreground">
              A notification was dispatched and the case advanced automatically.
            </p>
          ) : null}

          <div className="mt-4 border-t border-border pt-4">
            <CaseManagerActions
              caseId={detail.case.id}
              sendBacks={sendBacks}
              canManage={canManage}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Comments</h2>
            <div className="mt-3">
              <CommentsPanel caseId={detail.case.id} currentUserId={ctx.userId!} />
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attachments</h2>
            <div className="mt-3">
              <AttachmentsPanel caseId={detail.case.id} currentUserId={ctx.userId!} />
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {detail.history.length === 0 ? (
              <li className="text-muted-foreground">No history yet.</li>
            ) : (
              detail.history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <span>
                    <strong className="font-medium text-foreground">{h.action}</strong>
                    <span className="text-muted-foreground"> · {h.fromStepId ?? '—'} → {h.toStepId ?? '—'}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {h.occurredAt.toISOString().slice(0, 16).replace('T', ' ')}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function SlaBadge({ status }: { status: 'on_track' | 'warning' | 'breached' | null }) {
  if (!status) return null;
  const cls =
    status === 'breached'
      ? 'border-destructive/40 bg-destructive/10 text-destructive'
      : status === 'warning'
        ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${cls}`}>
      SLA · {status.replace('_', ' ')}
    </span>
  );
}

function StageProgress({
  stages,
  currentStageId,
}: {
  stages: Array<{ id: string; name: string }>;
  currentStageId: string;
}) {
  const currentIdx = stages.findIndex((s) => s.id === currentStageId);
  return (
    <ol className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-card p-3">
      {stages.map((s, i) => {
        const state = i < currentIdx ? 'past' : i === currentIdx ? 'current' : 'future';
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                'rounded-full px-3 py-1 text-xs font-medium ' +
                (state === 'current'
                  ? 'bg-primary text-primary-foreground'
                  : state === 'past'
                    ? 'bg-secondary text-foreground'
                    : 'border border-border text-muted-foreground')
              }
            >
              {s.name}
            </span>
            {i < stages.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
