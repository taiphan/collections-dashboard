import type { ExpressionAst } from '@/lib/types/expressions';
import { evaluate } from '@/lib/expressions';
import type { FormComponent, FormDefinition } from '@/lib/validation/form';

/**
 * Compute which component ids are visible given the current values.
 * Components with no visibility rule are always visible. Components nested
 * inside a hidden section are hidden too.
 */
export function computeVisibility(
  form: FormDefinition,
  values: Record<string, unknown>,
): Set<string> {
  const visible = new Set<string>();
  const byId = new Map<string, FormComponent>(form.components.map((c) => [c.id, c]));

  function isVisibleSelf(c: FormComponent): boolean {
    if (!c.visibility) return true;
    return evaluate(c.visibility as ExpressionAst, values);
  }

  function walk(id: string, parentVisible: boolean) {
    const c = byId.get(id);
    if (!c) return;
    const self = parentVisible && isVisibleSelf(c);
    if (self) visible.add(id);
    if (c.kind === 'section') {
      for (const childId of c.childIds) walk(childId, self);
    }
  }

  for (const rootId of form.rootComponentIds) walk(rootId, true);
  return visible;
}
