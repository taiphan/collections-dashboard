import { describe, it, expect } from 'vitest';
import { decisionTableDefinitionSchema } from '@/lib/validation/decision-table';
import { evaluateDecisionTable } from '@/lib/decisions';

const def = decisionTableDefinitionSchema.parse({
  inputs: [
    { id: 'amount', label: 'Amount', type: 'number' },
    { id: 'priority', label: 'Priority', type: 'text' },
  ],
  outputs: [{ id: 'route', label: 'Route', type: 'text' }],
  rows: [
    {
      id: 'r1',
      conditions: { amount: { op: '<', value: 100 }, priority: { op: 'any' } },
      outputs: { route: 'auto' },
    },
    {
      id: 'r2',
      conditions: { amount: { op: 'between', min: 100, max: 1000 }, priority: { op: '==', value: 'high' } },
      outputs: { route: 'fast_track' },
    },
    {
      id: 'r3',
      conditions: { amount: { op: '>=', value: 100 }, priority: { op: 'any' } },
      outputs: { route: 'manual' },
    },
  ],
  defaultOutputs: { route: 'unknown' },
});

describe('decision table evaluator', () => {
  it('returns the first matching row', () => {
    expect(evaluateDecisionTable(def, { amount: 50, priority: 'low' })).toMatchObject({
      matched: true,
      rowId: 'r1',
      outputs: { route: 'auto' },
    });
  });

  it('respects between + equals combinations', () => {
    expect(evaluateDecisionTable(def, { amount: 500, priority: 'high' })).toMatchObject({
      rowId: 'r2',
      outputs: { route: 'fast_track' },
    });
  });

  it('falls through to a later row when an earlier row does not match', () => {
    expect(evaluateDecisionTable(def, { amount: 500, priority: 'low' })).toMatchObject({
      rowId: 'r3',
      outputs: { route: 'manual' },
    });
  });

  it('returns defaultOutputs when nothing matches', () => {
    // r1 needs amount < 100; r2 needs 100 ≤ amount ≤ 1000 + priority high; r3 needs amount ≥ 100.
    // amount = 100 with priority 'low' falls into r3, so to test default-fallthrough we need
    // a definition where the row coverage genuinely has gaps. Use a scoped local def.
    const narrow = decisionTableDefinitionSchema.parse({
      inputs: [
        { id: 'amount', label: 'Amount', type: 'number' },
        { id: 'priority', label: 'Priority', type: 'text' },
      ],
      outputs: [{ id: 'route', label: 'Route', type: 'text' }],
      rows: [
        {
          id: 'only_high',
          conditions: { amount: { op: 'between', min: 0, max: 1000 }, priority: { op: '==', value: 'high' } },
          outputs: { route: 'fast' },
        },
      ],
      defaultOutputs: { route: 'unknown' },
    });
    expect(evaluateDecisionTable(narrow, { amount: 50, priority: 'low' })).toMatchObject({
      matched: false,
      rowId: null,
      outputs: { route: 'unknown' },
    });
  });

  it('rejects rows that reference unknown columns at validation time', () => {
    const result = decisionTableDefinitionSchema.safeParse({
      inputs: [{ id: 'amount', label: 'Amount', type: 'number' }],
      outputs: [{ id: 'route', label: 'Route', type: 'text' }],
      rows: [
        {
          id: 'r1',
          conditions: { unknown_col: { op: 'any' } },
          outputs: { route: 'x' },
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
