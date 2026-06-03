/**
 * Expression evaluator — pure, deterministic, no I/O.
 *
 * Property 6 (Expression determinism): identical inputs MUST produce identical
 * outputs across calls. Do not introduce clock reads, randomness, or any
 * side-effecting operations into this module.
 */

import type {
  CompiledExpression,
  ExpressionAst,
  LiteralValue,
} from '@/lib/types/expressions';

export type FieldValues = Record<string, unknown>;

/**
 * Compile an AST into the (currently identical) compiled form.
 *
 * Accepts an already-AST input. A future visual rule builder may produce a
 * higher-level shape that compiles down to the same AST.
 */
export function compile(ast: ExpressionAst): CompiledExpression {
  return ast;
}

/**
 * Evaluate a compiled expression against a values map. Always returns a
 * boolean; non-boolean expressions are coerced via JavaScript truthiness only
 * at the top level. Inner nodes return raw JS values.
 */
export function evaluate(
  compiled: CompiledExpression,
  values: FieldValues,
): boolean {
  return Boolean(evalNode(compiled, values));
}

function evalNode(node: ExpressionAst, values: FieldValues): unknown {
  switch (node.kind) {
    case 'literal':
      return node.value;
    case 'field':
      return readPath(values, node.path);
    case 'unary':
      return !evalNode(node.operand, values);
    case 'binary': {
      const left = evalNode(node.left, values);
      const right = evalNode(node.right, values);
      switch (node.op) {
        case '==':
          return strictEqual(left, right);
        case '!=':
          return !strictEqual(left, right);
        case '<':
          return cmp(left, right) < 0;
        case '<=':
          return cmp(left, right) <= 0;
        case '>':
          return cmp(left, right) > 0;
        case '>=':
          return cmp(left, right) >= 0;
        case 'in':
          return Array.isArray(right) && right.some((v) => strictEqual(v, left));
      }
    }
    // Falls through deliberately if `node.op` ever escapes the switch above.
    case 'logical': {
      const left = Boolean(evalNode(node.left, values));
      if (node.op === '&&') {
        return left && Boolean(evalNode(node.right, values));
      }
      return left || Boolean(evalNode(node.right, values));
    }
  }
}

/**
 * Path lookup is intentionally simple: dot-segmented string into a nested
 * object. Missing values return `undefined` so evaluators downstream can
 * decide on truthiness; we do NOT throw, because production runtime hides
 * components behind missing fields rather than blocking the user.
 */
function readPath(values: FieldValues, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = values;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function strictEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  // Normalize null/undefined to be equal (both mean "no value").
  if (a == null && b == null) return true;
  return false;
}

function cmp(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  // Date strings: ISO-8601 strings sort lexicographically. Anything else falls
  // back to string compare so the evaluator never throws.
  return String(a ?? '').localeCompare(String(b ?? ''));
}

/**
 * Helper: produce a literal AST node.
 */
export function lit(value: LiteralValue): ExpressionAst {
  return { kind: 'literal', value };
}

/**
 * Helper: produce a field AST node.
 */
export function field(path: string): ExpressionAst {
  return { kind: 'field', path };
}
