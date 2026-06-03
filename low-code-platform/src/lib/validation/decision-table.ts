import { z } from 'zod';
import { humanNameSchema, identifierSchema } from '@/lib/validation/identifiers';

/**
 * Decision table definition.
 *
 * Inputs are typed columns referenced by id; outputs are named cells. Rows are
 * evaluated in order and the first row whose conditions all match wins. A
 * `default` row may be supplied for fall-through.
 *
 * Pillar V2.D — deterministic only. No ML, no probabilistic outcomes.
 */

// Cell schema below carries the operator literals directly; an explicit
// operator enum was kept earlier as a sketch but was never consumed.

const inputColumnSchema = z.object({
  id: identifierSchema,
  label: humanNameSchema,
  type: z.enum(['text', 'number', 'boolean']),
});

const outputColumnSchema = z.object({
  id: identifierSchema,
  label: humanNameSchema,
  type: z.enum(['text', 'number', 'boolean']),
});

const cellSchema = z.union([
  z.object({ op: z.literal('any') }),
  z.object({ op: z.literal('=='), value: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ op: z.literal('!='), value: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ op: z.literal('<'), value: z.number() }),
  z.object({ op: z.literal('<='), value: z.number() }),
  z.object({ op: z.literal('>'), value: z.number() }),
  z.object({ op: z.literal('>='), value: z.number() }),
  z.object({ op: z.literal('in'), value: z.array(z.union([z.string(), z.number()])) }),
  z.object({ op: z.literal('between'), min: z.number(), max: z.number() }),
]);

const rowSchema = z.object({
  id: z.string().min(1),
  conditions: z.record(z.string(), cellSchema),
  outputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export const decisionTableDefinitionSchema = z
  .object({
    inputs: z.array(inputColumnSchema).min(1).max(20),
    outputs: z.array(outputColumnSchema).min(1).max(20),
    rows: z.array(rowSchema).min(1).max(500),
    /** Optional fallthrough outputs when no row matches. */
    defaultOutputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  })
  .superRefine((def, ctx) => {
    const inputIds = new Set(def.inputs.map((i) => i.id));
    const outputIds = new Set(def.outputs.map((o) => o.id));
    def.rows.forEach((row, rIdx) => {
      for (const condKey of Object.keys(row.conditions)) {
        if (!inputIds.has(condKey)) {
          ctx.addIssue({
            code: 'custom',
            path: ['rows', rIdx, 'conditions', condKey],
            message: `Unknown input column "${condKey}".`,
          });
        }
      }
      for (const outKey of Object.keys(row.outputs)) {
        if (!outputIds.has(outKey)) {
          ctx.addIssue({
            code: 'custom',
            path: ['rows', rIdx, 'outputs', outKey],
            message: `Unknown output column "${outKey}".`,
          });
        }
      }
    });
  });

export type DecisionTableDefinition = z.infer<typeof decisionTableDefinitionSchema>;
export type DecisionCell = z.infer<typeof cellSchema>;
