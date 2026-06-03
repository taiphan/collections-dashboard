import type { FormComponent, FormDefinition, FormValidationRule } from '@/lib/validation/form';

export interface FieldError {
  componentId: string;
  message: string;
}

function isFieldBound(
  c: FormComponent,
): c is Extract<FormComponent, { fieldPath: string }> {
  return 'fieldPath' in c;
}

function applyRule(
  rule: FormValidationRule,
  value: unknown,
): string | null {
  switch (rule.kind) {
    case 'required':
      if (value === undefined || value === null || value === '') return 'This field is required.';
      return null;
    case 'min':
      if (typeof value === 'number' && value < rule.value) return `Minimum is ${rule.value}.`;
      if (typeof value === 'string' && value.length < rule.value)
        return `Minimum length is ${rule.value}.`;
      return null;
    case 'max':
      if (typeof value === 'number' && value > rule.value) return `Maximum is ${rule.value}.`;
      if (typeof value === 'string' && value.length > rule.value)
        return `Maximum length is ${rule.value}.`;
      return null;
    case 'regex':
      if (typeof value !== 'string') return null;
      try {
        if (!new RegExp(rule.pattern).test(value)) return 'Invalid format.';
      } catch {
        return null;
      }
      return null;
    case 'custom':
      // Named custom rules are out of MVP; treat as a no-op so unknown rules
      // never block users.
      return null;
  }
}

/**
 * Validate values against a form. Only field-bound components surface errors.
 * Hidden components (per visibility) should be passed via `visibleIds` so
 * their rules are skipped.
 */
export function validateValues(
  form: FormDefinition,
  values: Record<string, unknown>,
  visibleIds?: Set<string>,
): FieldError[] {
  const errors: FieldError[] = [];
  for (const c of form.components) {
    if (!isFieldBound(c)) continue;
    if (visibleIds && !visibleIds.has(c.id)) continue;
    const value = values[c.fieldPath];
    for (const rule of c.validation ?? []) {
      const err = applyRule(rule, value);
      if (err) errors.push({ componentId: c.id, message: err });
    }
  }
  return errors;
}
