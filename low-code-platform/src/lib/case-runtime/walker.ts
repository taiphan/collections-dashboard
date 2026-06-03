/**
 * Pure helpers that walk a CaseTypeDefinition graph.
 *
 * No I/O, no DB. Used by the case runtime to find next steps, resolve
 * transition targets, and validate send-back precedence.
 */

import type {
  CaseTypeDefinition,
  Stage,
  Step,
} from '@/lib/validation/case-type';

export interface StepLocator {
  stage: Stage;
  stageIndex: number;
  step: Step;
  stepIndex: number;
}

export function findStep(
  def: CaseTypeDefinition,
  stepId: string,
): StepLocator | null {
  for (let s = 0; s < def.stages.length; s++) {
    const stage = def.stages[s]!;
    for (let i = 0; i < stage.steps.length; i++) {
      const step = stage.steps[i]!;
      if (step.id === stepId) {
        return { stage, stageIndex: s, step, stepIndex: i };
      }
    }
  }
  return null;
}

export function findStage(def: CaseTypeDefinition, stageId: string): { stage: Stage; index: number } | null {
  const idx = def.stages.findIndex((s) => s.id === stageId);
  if (idx < 0) return null;
  return { stage: def.stages[idx]!, index: idx };
}

export function firstStepOfStage(stage: Stage): Step | null {
  return stage.steps[0] ?? null;
}

export function nextStepInOrder(
  def: CaseTypeDefinition,
  fromStepId: string,
):
  | { kind: 'step'; stageId: string; step: Step }
  | { kind: 'stage'; stage: Stage; step: Step }
  | { kind: 'resolve' }
  | null {
  const loc = findStep(def, fromStepId);
  if (!loc) return null;
  // Next step within current stage.
  if (loc.stepIndex + 1 < loc.stage.steps.length) {
    return { kind: 'step', stageId: loc.stage.id, step: loc.stage.steps[loc.stepIndex + 1]! };
  }
  // First step of next stage.
  if (loc.stageIndex + 1 < def.stages.length) {
    const nextStage = def.stages[loc.stageIndex + 1]!;
    return { kind: 'stage', stage: nextStage, step: nextStage.steps[0]! };
  }
  return { kind: 'resolve' };
}

/** Global declared order index for a step id (used by Property 5 checks). */
export function declaredOrderIndex(def: CaseTypeDefinition, stepId: string): number {
  let idx = 0;
  for (const s of def.stages) {
    for (const st of s.steps) {
      if (st.id === stepId) return idx;
      idx++;
    }
  }
  return -1;
}
