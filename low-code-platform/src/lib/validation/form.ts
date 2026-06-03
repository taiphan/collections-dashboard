import { z } from 'zod';
import {
  formComponentFieldCompatibility,
  type FieldDefinition,
  type FieldKind,
} from '@/lib/validation/entity';
import { humanNameSchema, identifierSchema } from '@/lib/validation/identifiers';
import { expressionSchema } from '@/lib/validation/expressions';

/**
 * FormDefinition Zod schema (Requirement 5).
 *
 * Component-to-field-type compatibility is checked via `validateFormAgainstEntity`
 * because that check needs the entity definition. The base Zod schema only
 * validates structural well-formedness so it can stand alone in tooling.
 */

const validationRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('required') }),
  z.object({ kind: z.literal('min'), value: z.number() }),
  z.object({ kind: z.literal('max'), value: z.number() }),
  z.object({ kind: z.literal('regex'), pattern: z.string() }),
  z.object({ kind: z.literal('custom'), name: z.string(), params: z.record(z.string(), z.unknown()).optional() }),
]);

export type FormValidationRule = z.infer<typeof validationRuleSchema>;

const baseComponent = {
  id: z.string().min(1),
  visibility: expressionSchema.optional(),
  validation: z.array(validationRuleSchema).max(20).optional(),
};

const fieldBoundBase = {
  ...baseComponent,
  fieldPath: identifierSchema,
  label: humanNameSchema,
};

const textComponent = z.object({ kind: z.literal('text_input'), ...fieldBoundBase, placeholder: z.string().max(120).optional() });
const numberComponent = z.object({ kind: z.literal('number_input'), ...fieldBoundBase, placeholder: z.string().max(120).optional() });
const dateComponent = z.object({ kind: z.literal('date_picker'), ...fieldBoundBase });
const datetimeComponent = z.object({ kind: z.literal('datetime_picker'), ...fieldBoundBase });
const booleanComponent = z.object({ kind: z.literal('boolean_toggle'), ...fieldBoundBase });
const selectComponent = z.object({ kind: z.literal('select'), ...fieldBoundBase });
const lookupComponent = z.object({ kind: z.literal('lookup'), ...fieldBoundBase });
const tableComponent = z.object({
  kind: z.literal('table'),
  ...fieldBoundBase,
  columns: z.array(z.string()).max(20).default([]),
});
const fileComponent = z.object({ kind: z.literal('file_upload'), ...fieldBoundBase });

const labelComponent = z.object({
  kind: z.literal('label'),
  ...baseComponent,
  text: humanNameSchema,
});

const sectionComponent = z.object({
  kind: z.literal('section'),
  ...baseComponent,
  title: humanNameSchema,
  childIds: z.array(z.string()).max(200).default([]),
});

export const formComponentSchema = z.discriminatedUnion('kind', [
  textComponent,
  numberComponent,
  dateComponent,
  datetimeComponent,
  booleanComponent,
  selectComponent,
  lookupComponent,
  tableComponent,
  fileComponent,
  labelComponent,
  sectionComponent,
]);

export type FormComponent = z.infer<typeof formComponentSchema>;

export const formDefinitionSchema = z
  .object({
    entityId: z.string().uuid(),
    rootComponentIds: z.array(z.string()).min(1, 'A form must contain at least one component.'),
    components: z.array(formComponentSchema).min(1),
  })
  .superRefine((def, ctx) => {
    // Component id uniqueness
    const seen = new Set<string>();
    def.components.forEach((c, idx) => {
      if (seen.has(c.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['components', idx, 'id'],
          message: `Duplicate component id "${c.id}".`,
        });
      }
      seen.add(c.id);
    });

    // Root and section child ids resolve
    const ids = new Set(def.components.map((c) => c.id));
    def.rootComponentIds.forEach((id, idx) => {
      if (!ids.has(id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rootComponentIds', idx],
          message: `Unknown component id "${id}".`,
        });
      }
    });
    def.components.forEach((c, idx) => {
      if (c.kind === 'section') {
        c.childIds.forEach((cid, cidIdx) => {
          if (!ids.has(cid)) {
            ctx.addIssue({
              code: 'custom',
              path: ['components', idx, 'childIds', cidIdx],
              message: `Unknown child component id "${cid}".`,
            });
          }
        });
      }
    });
  });

export type FormDefinition = z.infer<typeof formDefinitionSchema>;

export const createFormInputSchema = z.object({
  name: identifierSchema,
  label: humanNameSchema,
  definition: formDefinitionSchema,
});

export type CreateFormInput = z.infer<typeof createFormInputSchema>;

/**
 * Cross-check a FormDefinition against an EntityDefinition. Enforces
 * Property 7 (form-component-to-field-type compatibility) and Requirement 5.7
 * (every bound field must exist on the entity).
 */
export interface FormCompatibilityIssue {
  componentId: string;
  reason: string;
}

export function validateFormAgainstEntity(
  form: FormDefinition,
  entityFields: readonly FieldDefinition[],
): FormCompatibilityIssue[] {
  const issues: FormCompatibilityIssue[] = [];
  const fieldByName = new Map<string, FieldKind>();
  entityFields.forEach((f) => {
    fieldByName.set(f.name, f.kind);
  });

  for (const c of form.components) {
    if (c.kind === 'label' || c.kind === 'section') continue;
    const allowed = formComponentFieldCompatibility[c.kind];
    if (!allowed) {
      issues.push({
        componentId: c.id,
        reason: `Unknown component kind "${c.kind}".`,
      });
      continue;
    }
    const fieldKind = fieldByName.get(c.fieldPath);
    if (!fieldKind) {
      issues.push({
        componentId: c.id,
        reason: `Field "${c.fieldPath}" does not exist on the bound entity.`,
      });
      continue;
    }
    if (!allowed.includes(fieldKind)) {
      issues.push({
        componentId: c.id,
        reason: `Component "${c.kind}" cannot bind to field of type "${fieldKind}".`,
      });
    }
  }

  return issues;
}
