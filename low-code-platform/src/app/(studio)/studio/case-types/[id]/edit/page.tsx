import { notFound } from 'next/navigation';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasAnyRole } from '@/lib/rbac/roles';
import { ForbiddenError, HttpError } from '@/lib/auth/errors';
import * as caseDesigner from '@/lib/services/case-designer';
import * as dataModel from '@/lib/services/data-model';
import * as formDesigner from '@/lib/services/form-designer';
import * as connectors from '@/lib/services/connectors';
import * as decisionTables from '@/lib/services/decision-tables';
import { CaseTypeEditor } from '@/components/studio/case-type-designer/CaseTypeEditor';
import { toDraft } from '@/components/studio/case-type-designer/deserialize';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCaseTypePage({ params }: Props) {
  const ctx = await requireTenantContext();
  if (!hasAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN])) {
    throw new ForbiddenError();
  }
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof caseDesigner.getCaseType>>;
  try {
    detail = await caseDesigner.getCaseType(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }

  const def = detail.latestDefinition ?? detail.publishedDefinition;
  if (!def) notFound();

  const [entities, forms, conns, tables] = await Promise.all([
    dataModel.listEntities(ctx),
    formDesigner.listForms(ctx),
    connectors.list(ctx),
    decisionTables.list(ctx),
  ]);

  const context = {
    entities: entities
      .filter((e) => e.publishedVersion != null)
      .map((e) => ({ id: e.id, name: e.name, label: e.label })),
    forms: forms
      .filter((f) => f.publishedVersion != null)
      .map((f) => ({ id: f.id, name: f.name, label: f.label, entityId: f.entityId })),
    connectors: conns.map((c) => ({ id: c.id, name: c.name, label: c.label, kind: c.kind })),
    decisionTables: tables.map((d) => ({ id: d.id, name: d.name, label: d.label })),
  };

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">
          Edit {detail.summary.label}
        </h1>
        <p className="text-sm text-muted-foreground">
          Saving creates a new draft version. Publish it from the case type page.
        </p>
        <CaseTypeEditor
          context={context}
          existing={{
            id: detail.summary.id,
            name: detail.summary.name,
            label: detail.summary.label,
            draft: toDraft(def),
          }}
        />
      </div>
    </AppShell>
  );
}
