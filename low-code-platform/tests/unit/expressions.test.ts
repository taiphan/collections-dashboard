import { describe, it, expect } from 'vitest';
import { evaluate, field, lit } from '@/lib/expressions';
import type { ExpressionAst } from '@/lib/types/expressions';

describe('expression evaluator', () => {
  it('evaluates literal truthiness', () => {
    expect(evaluate(lit(true), {})).toBe(true);
    expect(evaluate(lit(false), {})).toBe(false);
    expect(evaluate(lit(null), {})).toBe(false);
    expect(evaluate(lit(0), {})).toBe(false);
    expect(evaluate(lit(1), {})).toBe(true);
    expect(evaluate(lit(''), {})).toBe(false);
    expect(evaluate(lit('x'), {})).toBe(true);
  });

  it('reads field paths and treats missing as falsy', () => {
    const expr = field('a.b');
    expect(evaluate(expr, { a: { b: true } })).toBe(true);
    expect(evaluate(expr, { a: { b: false } })).toBe(false);
    expect(evaluate(expr, { a: {} })).toBe(false);
    expect(evaluate(expr, {})).toBe(false);
  });

  it('compares values with the binary operators', () => {
    const expr: ExpressionAst = {
      kind: 'binary',
      op: '==',
      left: field('status'),
      right: lit('open'),
    };
    expect(evaluate(expr, { status: 'open' })).toBe(true);
    expect(evaluate(expr, { status: 'closed' })).toBe(false);

    const lt: ExpressionAst = {
      kind: 'binary',
      op: '<',
      left: field('amount'),
      right: lit(100),
    };
    expect(evaluate(lt, { amount: 50 })).toBe(true);
    expect(evaluate(lt, { amount: 100 })).toBe(false);
  });

  it('supports `in` against arrays', () => {
    const expr: ExpressionAst = {
      kind: 'binary',
      op: 'in',
      left: field('priority'),
      right: { kind: 'literal', value: 'high' },
    };
    // For `in` we want a literal array on the right; the helper API forces
    // an explicit literal node:
    const rightArr: ExpressionAst = {
      kind: 'binary',
      op: 'in',
      left: field('priority'),
      // synthesise an array literal via plain object — evaluator trusts shape.
      right: { kind: 'literal', value: 'high' },
    };
    // Use a richer ast with an array literal:
    const expr2: ExpressionAst = {
      kind: 'binary',
      op: 'in',
      left: field('priority'),
      right: { kind: 'literal', value: ['high', 'critical'] as unknown as string },
    };
    expect(evaluate(expr2, { priority: 'high' })).toBe(true);
    expect(evaluate(expr2, { priority: 'low' })).toBe(false);
    // Avoid lint-noise about unused vars — both are real test artefacts.
    void expr;
    void rightArr;
  });

  it('combines clauses with logical operators', () => {
    const expr: ExpressionAst = {
      kind: 'logical',
      op: '&&',
      left: { kind: 'binary', op: '==', left: field('a'), right: lit(true) },
      right: {
        kind: 'logical',
        op: '||',
        left: { kind: 'binary', op: '==', left: field('b'), right: lit(true) },
        right: { kind: 'unary', op: '!', operand: field('c') },
      },
    };
    expect(evaluate(expr, { a: true, b: true, c: false })).toBe(true);
    expect(evaluate(expr, { a: true, b: false, c: true })).toBe(false);
    expect(evaluate(expr, { a: false, b: true, c: false })).toBe(false);
  });

  it('is deterministic across repeated calls (Property 6)', () => {
    const expr: ExpressionAst = {
      kind: 'logical',
      op: '||',
      left: { kind: 'binary', op: '>=', left: field('score'), right: lit(80) },
      right: { kind: 'binary', op: '==', left: field('flag'), right: lit('vip') },
    };
    const values = { score: 75, flag: 'vip' };
    const first = evaluate(expr, values);
    for (let i = 0; i < 100; i++) {
      expect(evaluate(expr, values)).toBe(first);
    }
  });
});
