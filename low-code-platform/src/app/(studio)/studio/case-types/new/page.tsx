import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasAnyRole } from '@/lib/rbac/roles';
import { ForbiddenError } from '@/lib/auth/errors';
import * as dataModel from '@/lib/services/data-model';
import * as formDesigner from '@/lib/services/form-designer';
import * as connectors from '@/lib/services/connectors';
import * as decisionTables from '@/lib/services/decision-tables';
import { CaseTypeEditor } from '@/components/studio/case-type-designer/CaseTypeEditor';

export const dynamic = 'force-dynamic';

export default async function NewCaseTypePage() {
  const ctx = await requireTenantContext();
  if (!hasAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN])) {
    throw new ForbiddenError();
  }

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
        <h1 className="text-xl font-semibold tracking-tight">New case type</h1>
        {context.entities.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Publish at least one entity before designing a case type.
          </p>
        ) : (
          <CaseTypeEditor context={context} />
        )}
      </div>
    </AppShell>
  );
}
