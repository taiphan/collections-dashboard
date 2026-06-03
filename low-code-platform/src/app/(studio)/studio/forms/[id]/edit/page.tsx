import { notFound } from 'next/navigation';
import { requireTenantContext } from '@/lib/tenancy/context';
import { AppShell } from '@/components/shared/AppShell';
import { ROLES, hasAnyRole } from '@/lib/rbac/roles';
import { ForbiddenError, HttpError } from '@/lib/auth/errors';
import * as formDesigner from '@/lib/services/form-designer';
import * as dataModel from '@/lib/services/data-model';
import { FormEditor } from '@/components/studio/form-designer/FormEditor';
import type { EntityDefinition, FieldDefinition } from '@/lib/validation/entity';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFormPage({ params }: Props) {
  const ctx = await requireTenantContext();
  if (!hasAnyRole(ctx, [ROLES.APP_DESIGNER, ROLES.PLATFORM_ADMIN])) {
    throw new ForbiddenError();
  }
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof formDesigner.getForm>>;
  try {
    detail = await formDesigner.getForm(ctx, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
  const def = detail.latestDefinition ?? detail.publishedDefinition;
  if (!def) notFound();

  // Only the bound entity is needed (the editor disables the entity select for existing forms),
  // but we hand all entities for completeness.
  const entitySummaries = await dataModel.listEntities(ctx);
  const entities = await Promise.all(
    entitySummaries.map(async (e) => {
      const ed = await dataModel.getEntity(ctx, e.id);
      const eDef = (ed.latestDefinition ?? ed.publishedDefinition) as EntityDefinition | null;
      return {
        id: e.id,
        label: e.label,
        fields: (eDef?.fields ?? []) as FieldDefinition[],
      };
    }),
  );

  return (
    <AppShell active="studio">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Edit {detail.summary.label}</h1>
        <FormEditor
          entities={entities}
          existing={{
            id: detail.summary.id,
            name: detail.summary.name,
            label: detail.summary.label,
            definition: def,
          }}
        />
      </div>
    </AppShell>
  );
}
