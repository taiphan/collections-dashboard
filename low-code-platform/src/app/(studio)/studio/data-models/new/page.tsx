import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasAnyRole } from '@/lib/rbac/roles';
import { ForbiddenError } from '@/lib/auth/errors';
import * as dataModel from '@/lib/services/data-model';
import { EntityEditor } from '@/components/studio/data-model-designer/EntityEditor';

export const dynamic = 'force-dynamic';

export default async function NewEntityPage() {
  const ctx = await requireTenantContext();
  if (!hasAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN])) {
    throw new ForbiddenError();
  }
  const entities = await dataModel.listEntities(ctx);
  const entityOptions = entities.map((e) => ({ id: e.id, label: e.label }));

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">New entity</h1>
        <EntityEditor entityOptions={entityOptions} />
      </div>
    </AppShell>
  );
}
