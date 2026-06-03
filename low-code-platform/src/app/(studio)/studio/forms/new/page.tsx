import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasAnyRole } from '@/lib/rbac/roles';
import { ForbiddenError } from '@/lib/auth/errors';
import * as dataModel from '@/lib/services/data-model';
import { FormEditor } from '@/components/studio/form-designer/FormEditor';
import type { EntityDefinition, FieldDefinition } from '@/lib/validation/entity';

export const dynamic = 'force-dynamic';

export default async function NewFormPage() {
  const ctx = await requireTenantContext();
  if (!hasAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN])) {
    throw new ForbiddenError();
  }
  const entitySummaries = await dataModel.listEntities(ctx);
  const entities = await Promise.all(
    entitySummaries.map(async (e) => {
      const detail = await dataModel.getEntity(ctx, e.id);
      const def = (detail.latestDefinition ?? detail.publishedDefinition) as
        | EntityDefinition
        | null;
      return {
        id: e.id,
        label: e.label,
        fields: (def?.fields ?? []) as FieldDefinition[],
      };
    }),
  );

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">New form</h1>
        {entities.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Create at least one entity first.
          </p>
        ) : (
          <FormEditor entities={entities} />
        )}
      </div>
    </AppShell>
  );
}
