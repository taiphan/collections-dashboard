/**
 * Expression AST used by visibility rules (FormDefinition) and conditional
 * transitions (CaseTypeDefinition). Stored as JSON, evaluated by `lib/expressions`.
 *
 * Grammar (MVP):
 *   expr     := literal | field | unary | binary | logical
 *   binary   := { op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in', left, right }
 *   logical  := { op: '&&' | '||', left, right }
 *   unary    := { op: '!', operand }
 *
 * No function calls, no dot navigation beyond `field.path` strings (which the
 * evaluator looks up directly in the values map). The grammar is intentionally
 * narrow so the evaluator can be a pure, deterministic function.
 */

export type LiteralValue = string | number | boolean | null;

export type ExpressionAst =
  | { kind: 'literal'; value: LiteralValue }
  | { kind: 'field'; path: string }
  | { kind: 'unary'; op: '!'; operand: ExpressionAst }
  | {
      kind: 'binary';
      op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in';
      left: ExpressionAst;
      right: ExpressionAst;
    }
  | {
      kind: 'logical';
      op: '&&' | '||';
      left: ExpressionAst;
      right: ExpressionAst;
    };

/**
 * Compiled form is the same shape as the AST for now; reserved for future
 * optimization (e.g. path interning) without touching call sites.
 */
export type CompiledExpression = ExpressionAst;
