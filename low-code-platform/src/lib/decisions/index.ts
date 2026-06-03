/**
 * Decision-table evaluator. Pure, deterministic. (Pillar V2.D)
 */

import type {
  DecisionCell,
  DecisionTableDefinition,
} from '@/lib/validation/decision-table';

export interface DecisionResult {
  matched: boolean;
  rowId: string | null;
  outputs: Record<string, unknown>;
}

function cellMatches(cell: DecisionCell, value: unknown): boolean {
  switch (cell.op) {
    case 'any':
      return true;
    case '==':
      return value === cell.value;
    case '!=':
      return value !== cell.value;
    case '<':
      return typeof value === 'number' && value < cell.value;
    case '<=':
      return typeof value === 'number' && value <= cell.value;
    case '>':
      return typeof value === 'number' && value > cell.value;
    case '>=':
      return typeof value === 'number' && value >= cell.value;
    case 'in':
      return cell.value.some((v) => v === value);
    case 'between':
      return typeof value === 'number' && value >= cell.min && value <= cell.max;
  }
}

export function evaluateDecisionTable(
  def: DecisionTableDefinition,
  inputs: Record<string, unknown>,
): DecisionResult {
  for (const row of def.rows) {
    let allMatch = true;
    for (const [columnId, cell] of Object.entries(row.conditions)) {
      if (!cellMatches(cell, inputs[columnId])) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      return { matched: true, rowId: row.id, outputs: { ...row.outputs } };
    }
  }
  return {
    matched: false,
    rowId: null,
    outputs: def.defaultOutputs ? { ...def.defaultOutputs } : {},
  };
}
