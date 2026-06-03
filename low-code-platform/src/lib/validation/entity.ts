import { z } from 'zod';
import { humanNameSchema, identifierSchema } from '@/lib/validation/identifiers';

/**
 * EntityDefinition Zod schema (Requirement 3).
 *
 * Field-type-specific validation is encoded via discriminated unions so
 * mistakes at design time surface as clear field-level errors.
 */

export const fieldKinds = [
  'text',
  'number',
  'date',
  'datetime',
  'boolean',
  'select',
  'lookup',
  'table',
  'file',
] as const;

export type FieldKind = (typeof fieldKinds)[number];

const baseFieldShape = {
  id: z.string().uuid(),
  name: identifierSchema,
  label: humanNameSchema,
  required: z.boolean().default(false),
  description: z.string().max(500).optional(),
};

const textField = z.object({
  ...baseFieldShape,
  kind: z.literal('text'),
  maxLength: z.number().int().positive().max(10000).optional(),
});

const numberField = z.object({
  ...baseFieldShape,
  kind: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().default(false),
});

const dateField = z.object({ ...baseFieldShape, kind: z.literal('date') });
const datetimeField = z.object({
  ...baseFieldShape,
  kind: z.literal('datetime'),
});
const booleanField = z.object({ ...baseFieldShape, kind: z.literal('boolean') });

const selectField = z.object({
  ...baseFieldShape,
  kind: z.literal('select'),
  options: z
    .array(z.string().min(1).max(120))
    .min(1, 'Select fields require at least one option.'),
});

const lookupField = z.object({
  ...baseFieldShape,
  kind: z.literal('lookup'),
  /** ID of the referenced entity in the same tenant. */
  lookupEntityId: z.string().uuid(),
});

const tableField = z.object({
  ...baseFieldShape,
  kind: z.literal('table'),
  /** Name of the one-to-many relationship that holds the child rows. */
  childRelationship: identifierSchema,
});

const fileField = z.object({
  ...baseFieldShape,
  kind: z.literal('file'),
  acceptedContentTypes: z.array(z.string()).max(20).optional(),
  maxBytes: z.number().int().positive().max(100 * 1024 * 1024).optional(),
});

export const fieldSchema = z.discriminatedUnion('kind', [
  textField,
  numberField,
  dateField,
  datetimeField,
  booleanField,
  selectField,
  lookupField,
  tableField,
  fileField,
]);

export type FieldDefinition = z.infer<typeof fieldSchema>;

export const relationshipSchema = z.object({
  id: z.string().uuid(),
  name: identifierSchema,
  kind: z.enum(['one_to_one', 'one_to_many']),
  /** Target entity ID within the same tenant. */
  targetEntityId: z.string().uuid(),
});

export type RelationshipDefinition = z.infer<typeof relationshipSchema>;

export const entityDefinitionSchema = z
  .object({
    fields: z
      .array(fieldSchema)
      .min(1, 'An entity must declare at least one field.'),
    relationships: z.array(relationshipSchema).default([]),
  })
  .superRefine((def, ctx) => {
    // Field name uniqueness (Requirement 3.6)
    const seen = new Set<string>();
    def.fields.forEach((f, idx) => {
      const lower = f.name.toLowerCase();
      if (seen.has(lower)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields', idx, 'name'],
          message: `Duplicate field name "${f.name}".`,
        });
      }
      seen.add(lower);
    });

    // Number field min/max sanity
    def.fields.forEach((f, idx) => {
      if (f.kind === 'number' && f.min != null && f.max != null && f.min > f.max) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields', idx, 'min'],
          message: 'min must be less than or equal to max.',
        });
      }
    });

    // Relationship name uniqueness
    const relSeen = new Set<string>();
    def.relationships.forEach((r, idx) => {
      const lower = r.name.toLowerCase();
      if (relSeen.has(lower)) {
        ctx.addIssue({
          code: 'custom',
          path: ['relationships', idx, 'name'],
          message: `Duplicate relationship name "${r.name}".`,
        });
      }
      relSeen.add(lower);
    });
  });

export type EntityDefinition = z.infer<typeof entityDefinitionSchema>;

export const createEntityInputSchema = z.object({
  name: identifierSchema,
  label: humanNameSchema,
  definition: entityDefinitionSchema,
});

export type CreateEntityInput = z.infer<typeof createEntityInputSchema>;

/**
 * Map of which form components are allowed to bind to which field kinds.
 * Property 7 (form-component-to-field-type compatibility) lives here.
 */
export const formComponentFieldCompatibility: Record<string, readonly FieldKind[]> = {
  text_input: ['text'],
  number_input: ['number'],
  date_picker: ['date'],
  datetime_picker: ['datetime'],
  boolean_toggle: ['boolean'],
  select: ['select'],
  lookup: ['lookup'],
  table: ['table'],
  file_upload: ['file'],
  // label and section components are not bound to fields; they appear in the
  // FormDefinition's component union but never reference fieldPath.
} as const;
