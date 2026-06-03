import { notFound } from 'next/navigation';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasAnyRole } from '@/lib/rbac/roles';
import { ForbiddenError, HttpError } from '@/lib/auth/errors';
import * as dataModel from '@/lib/services/data-model';
import { EntityEditor } from '@/components/studio/data-model-designer/EntityEditor';
import type { EntityDefinition } from '@/lib/validation/entity';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEntityPage({ params }: Props) {
  const ctx = await requireTenantContext();
  if (!hasAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN])) {
    throw new ForbiddenError();
  }
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof dataModel.getEntity>>;
  try {
    detail = await dataModel.getEntity(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
  const def = (detail.latestDefinition ?? detail.publishedDefinition) as EntityDefinition | null;
  if (!def) notFound();

  const entities = await dataModel.listEntities(ctx);
  const entityOptions = entities
    .filter((e) => e.id !== id)
    .map((e) => ({ id: e.id, label: e.label }));

  const fields = def.fields.map((f) => ({
    id: f.id,
    name: f.name,
    label: f.label,
    kind: f.kind,
    required: f.required,
    options: f.kind === 'select' ? f.options.join(', ') : undefined,
    lookupEntityId: f.kind === 'lookup' ? f.lookupEntityId : undefined,
    childRelationship: f.kind === 'table' ? f.childRelationship : undefined,
  }));

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Edit {detail.summary.label}</h1>
        <EntityEditor
          entityOptions={entityOptions}
          existing={{
            id: detail.summary.id,
            name: detail.summary.name,
            label: detail.summary.label,
            fields,
          }}
        />
      </div>
    </AppShell>
  );
}
