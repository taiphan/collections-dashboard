import { describe, it, expect } from 'vitest';
import {
  entityDefinitionSchema,
  formComponentFieldCompatibility,
} from '@/lib/validation/entity';
import {
  formDefinitionSchema,
  validateFormAgainstEntity,
} from '@/lib/validation/form';
import { caseTypeDefinitionSchema } from '@/lib/validation/case-type';
import { identifierSchema } from '@/lib/validation/identifiers';

describe('identifier schema', () => {
  it('accepts valid identifiers', () => {
    expect(identifierSchema.safeParse('first_name').success).toBe(true);
    expect(identifierSchema.safeParse('amount2').success).toBe(true);
    expect(identifierSchema.safeParse('_x').success).toBe(true);
  });

  it('rejects invalid identifiers (Req 3.6)', () => {
    expect(identifierSchema.safeParse('1abc').success).toBe(false);
    expect(identifierSchema.safeParse('with space').success).toBe(false);
    expect(identifierSchema.safeParse('hyphen-name').success).toBe(false);
    expect(identifierSchema.safeParse('').success).toBe(false);
  });
});

describe('entity definition schema', () => {
  it('accepts a minimal entity', () => {
    const result = entityDefinitionSchema.safeParse({
      fields: [
        { id: '11111111-1111-4111-8111-111111111111', kind: 'text', name: 'first_name', label: 'First Name' },
      ],
      relationships: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects duplicate field names', () => {
    const result = entityDefinitionSchema.safeParse({
      fields: [
        { id: '11111111-1111-4111-8111-111111111111', kind: 'text', name: 'first_name', label: 'A' },
        { id: '22222222-2222-4222-8222-222222222222', kind: 'text', name: 'first_name', label: 'B' },
      ],
      relationships: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects select fields with no options (Req 3.3)', () => {
    const result = entityDefinitionSchema.safeParse({
      fields: [
        { id: '11111111-1111-4111-8111-111111111111', kind: 'select', name: 'priority', label: 'P', options: [] },
      ],
      relationships: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('form definition schema', () => {
  it('accepts a single-component form', () => {
    const ok = formDefinitionSchema.safeParse({
      entityId: '11111111-1111-4111-8111-111111111111',
      rootComponentIds: ['c1'],
      components: [
        { id: 'c1', kind: 'text_input', fieldPath: 'first_name', label: 'First Name' },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('rejects unknown root component ids', () => {
    const result = formDefinitionSchema.safeParse({
      entityId: '11111111-1111-4111-8111-111111111111',
      rootComponentIds: ['nope'],
      components: [
        { id: 'c1', kind: 'text_input', fieldPath: 'first_name', label: 'First Name' },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('form-component-to-field-type compatibility (Property 7)', () => {
  it('accepts compatible bindings', () => {
    const issues = validateFormAgainstEntity(
      {
        entityId: '11111111-1111-4111-8111-111111111111',
        rootComponentIds: ['c1'],
        components: [
          { id: 'c1', kind: 'text_input', fieldPath: 'name', label: 'Name' },
        ],
      },
      [
        { id: '22222222-2222-4222-8222-222222222222', kind: 'text', name: 'name', label: 'Name', required: false },
      ],
    );
    expect(issues).toHaveLength(0);
  });

  it('rejects incompatible bindings', () => {
    const issues = validateFormAgainstEntity(
      {
        entityId: '11111111-1111-4111-8111-111111111111',
        rootComponentIds: ['c1'],
        components: [
          { id: 'c1', kind: 'date_picker', fieldPath: 'name', label: 'Name' },
        ],
      },
      [
        { id: '22222222-2222-4222-8222-222222222222', kind: 'text', name: 'name', label: 'Name', required: false },
      ],
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].componentId).toBe('c1');
  });

  it('rejects bindings to nonexistent fields (Req 5.7)', () => {
    const issues = validateFormAgainstEntity(
      {
        entityId: '11111111-1111-4111-8111-111111111111',
        rootComponentIds: ['c1'],
        components: [
          { id: 'c1', kind: 'text_input', fieldPath: 'unknown_field', label: 'X' },
        ],
      },
      [
        { id: '22222222-2222-4222-8222-222222222222', kind: 'text', name: 'name', label: 'Name', required: false },
      ],
    );
    expect(issues).toHaveLength(1);
  });

  it('compatibility table covers every field-bound component', () => {
    expect(formComponentFieldCompatibility.text_input).toContain('text');
    expect(formComponentFieldCompatibility.date_picker).toContain('date');
    expect(formComponentFieldCompatibility.lookup).toContain('lookup');
  });
});

describe('case type definition schema', () => {
  const baseFormStep = (id: string) => ({
    id,
    name: id,
    kind: 'form_step' as const,
    formId: '11111111-1111-4111-8111-111111111111',
    assignment: { kind: 'specific_role' as const, role: 'case_worker' },
  });

  it('accepts a minimal case type', () => {
    const result = caseTypeDefinitionSchema.safeParse({
      primaryEntityId: '11111111-1111-4111-8111-111111111111',
      stages: [{ id: 's1', name: 'Intake', steps: [baseFormStep('p1')] }],
    });
    expect(result.success).toBe(true);
  });

  it('enforces send-back targets to be earlier (Property 5)', () => {
    const result = caseTypeDefinitionSchema.safeParse({
      primaryEntityId: '11111111-1111-4111-8111-111111111111',
      stages: [
        {
          id: 's1',
          name: 'A',
          steps: [
            {
              ...baseFormStep('p1'),
              sendBack: [{ id: 'sb1', targetStepId: 'p2', label: 'Back' }],
            },
            baseFormStep('p2'),
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects warning >= target on SLA', () => {
    const result = caseTypeDefinitionSchema.safeParse({
      primaryEntityId: '11111111-1111-4111-8111-111111111111',
      sla: { targetMinutes: 60, warningMinutes: 60 },
      stages: [{ id: 's1', name: 'A', steps: [baseFormStep('p1')] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects approval steps with unknown targets', () => {
    const result = caseTypeDefinitionSchema.safeParse({
      primaryEntityId: '11111111-1111-4111-8111-111111111111',
      stages: [
        {
          id: 's1',
          name: 'A',
          steps: [
            {
              id: 'a1',
              name: 'Approval',
              kind: 'approval_step',
              assignment: { kind: 'specific_role', role: 'manager' },
              approveTarget: { kind: 'step', stepId: 'unknown' },
              rejectTarget: { kind: 'resolve' },
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
