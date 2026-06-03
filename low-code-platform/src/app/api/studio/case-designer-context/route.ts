import { withCtx } from '@/lib/api/handler';
import * as dataModel from '@/lib/services/data-model';
import * as formDesigner from '@/lib/services/form-designer';
import * as connectors from '@/lib/services/connectors';
import * as decisionTables from '@/lib/services/decision-tables';

/**
 * Bundle the lookups the case-type editor needs to populate dropdowns:
 * published entities, published forms (grouped by entity), connectors, and
 * decision tables. One round-trip keeps the editor responsive.
 */
export const GET = withCtx(async ({ ctx }) => {
  const [entities, forms, conns, tables] = await Promise.all([
    dataModel.listEntities(ctx),
    formDesigner.listForms(ctx),
    connectors.list(ctx),
    decisionTables.list(ctx),
  ]);
  return {
    entities: entities
      .filter((e) => e.publishedVersion != null)
      .map((e) => ({ id: e.id, name: e.name, label: e.label })),
    forms: forms
      .filter((f) => f.publishedVersion != null)
      .map((f) => ({ id: f.id, name: f.name, label: f.label, entityId: f.entityId })),
    connectors: conns.map((c) => ({ id: c.id, name: c.name, label: c.label, kind: c.kind })),
    decisionTables: tables.map((d) => ({ id: d.id, name: d.name, label: d.label })),
  };
});
