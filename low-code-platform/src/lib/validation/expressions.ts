import { z } from 'zod';

/**
 * Zod schema for the ExpressionAst type defined in lib/types/expressions.ts.
 *
 * Kept here (rather than alongside the type) so consumers can import the type
 * without pulling Zod into bundles where validation is not needed.
 */

const literalValue: z.ZodType<string | number | boolean | null> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const expressionSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('literal'), value: literalValue }),
    z.object({ kind: z.literal('field'), path: z.string().min(1).max(200) }),
    z.object({
      kind: z.literal('unary'),
      op: z.literal('!'),
      operand: expressionSchema,
    }),
    z.object({
      kind: z.literal('binary'),
      op: z.enum(['==', '!=', '<', '<=', '>', '>=', 'in']),
      left: expressionSchema,
      right: expressionSchema,
    }),
    z.object({
      kind: z.literal('logical'),
      op: z.enum(['&&', '||']),
      left: expressionSchema,
      right: expressionSchema,
    }),
  ]),
);
