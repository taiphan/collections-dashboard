import { describe, it, expect } from 'vitest';
import {
  declaredOrderIndex,
  findStage,
  findStep,
  firstStepOfStage,
  nextStepInOrder,
} from '@/lib/case-runtime/walker';
import type { CaseTypeDefinition } from '@/lib/validation/case-type';

const def: CaseTypeDefinition = {
  primaryEntityId: '11111111-1111-4111-8111-111111111111',
  stages: [
    {
      id: 'intake',
      name: 'Intake',
      steps: [
        {
          id: 'collect',
          name: 'Collect',
          kind: 'form_step',
          formId: '22222222-2222-4222-8222-222222222222',
          assignment: { kind: 'specific_role', role: 'case_worker' },
        },
        {
          id: 'review',
          name: 'Review',
          kind: 'approval_step',
          assignment: { kind: 'specific_role', role: 'manager' },
          approveTarget: { kind: 'stage', stageId: 'closed' },
          rejectTarget: { kind: 'step', stepId: 'collect' },
        },
      ],
    },
    {
      id: 'closed',
      name: 'Closed',
      steps: [
        {
          id: 'finish',
          name: 'Finish',
          kind: 'automated_step',
        },
      ],
    },
  ],
};

describe('case walker', () => {
  it('finds steps and stages', () => {
    expect(findStep(def, 'review')?.step.id).toBe('review');
    expect(findStep(def, 'unknown')).toBeNull();
    expect(findStage(def, 'closed')?.index).toBe(1);
    expect(firstStepOfStage(def.stages[0]!)?.id).toBe('collect');
  });

  it('declaredOrderIndex respects declared order', () => {
    expect(declaredOrderIndex(def, 'collect')).toBe(0);
    expect(declaredOrderIndex(def, 'review')).toBe(1);
    expect(declaredOrderIndex(def, 'finish')).toBe(2);
  });

  it('nextStepInOrder advances within stage, across stages, and to resolve', () => {
    expect(nextStepInOrder(def, 'collect')).toMatchObject({
      kind: 'step',
      step: { id: 'review' },
    });
    const stageJump = nextStepInOrder(def, 'review');
    expect(stageJump?.kind).toBe('stage');
    expect(nextStepInOrder(def, 'finish')).toEqual({ kind: 'resolve' });
  });
});
