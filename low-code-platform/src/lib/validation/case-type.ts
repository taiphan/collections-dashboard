import { z } from 'zod';
import { humanNameSchema, identifierSchema } from '@/lib/validation/identifiers';
import { expressionSchema } from '@/lib/validation/expressions';

/**
 * CaseTypeDefinition Zod schema (Requirement 4).
 *
 * Property 5 (send-back targets earlier) and Property 4 (forward-or-declared
 * progression) are partially enforced here at design time; the runtime
 * re-checks both before transitioning.
 */

const slaSchema = z
  .object({
    targetMinutes: z.number().int().positive(),
    warningMinutes: z.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.warningMinutes != null && val.warningMinutes >= val.targetMinutes) {
      ctx.addIssue({
        code: 'custom',
        path: ['warningMinutes'],
        message: 'warningMinutes must be strictly less than targetMinutes.',
      });
    }
  });

const assignmentPolicySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('specific_user'), userId: z.string().uuid() }),
  z.object({ kind: z.literal('specific_role'), role: z.string().min(1).max(60) }),
  z.object({ kind: z.literal('manager_of_creator') }),
  z.object({ kind: z.literal('current_assignee') }),
]);

const transitionTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('step'), stepId: z.string().min(1) }),
  z.object({ kind: z.literal('stage'), stageId: z.string().min(1) }),
  z.object({ kind: z.literal('resolve') }),
]);

const conditionalTransitionSchema = z.object({
  id: z.string().min(1),
  condition: expressionSchema,
  target: transitionTargetSchema,
  label: humanNameSchema.optional(),
});

const sendBackTransitionSchema = z.object({
  id: z.string().min(1),
  targetStepId: z.string().min(1),
  label: humanNameSchema,
});

const formStep = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  kind: z.literal('form_step'),
  formId: z.string().uuid(),
  assignment: assignmentPolicySchema,
  transitions: z.array(conditionalTransitionSchema).max(20).optional(),
  sendBack: z.array(sendBackTransitionSchema).max(10).optional(),
});

const approvalStep = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  kind: z.literal('approval_step'),
  assignment: assignmentPolicySchema,
  approveTarget: transitionTargetSchema,
  rejectTarget: transitionTargetSchema,
  sendBack: z.array(sendBackTransitionSchema).max(10).optional(),
});

const notificationRecipientSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('current_assignee') }),
  z.object({ kind: z.literal('specific_user'), userId: z.string().uuid() }),
  z.object({ kind: z.literal('specific_role'), role: z.string().min(1).max(60) }),
]);

const notificationStep = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  kind: z.literal('notification_step'),
  recipients: z.array(notificationRecipientSchema).min(1),
  template: z.string().min(1).max(2000),
  transitions: z.array(conditionalTransitionSchema).max(20).optional(),
});

const automatedStep = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  kind: z.literal('automated_step'),
  transitions: z.array(conditionalTransitionSchema).max(20).optional(),
});

const connectorStep = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  kind: z.literal('connector_step'),
  /** Tenant-scoped connector id; resolved at runtime. */
  connectorId: z.string().uuid(),
  /** Mapping from `primaryEntityData` to connector inputs. Field paths or literals. */
  inputs: z.record(z.string(), z.unknown()),
  /** Optional: persist part of the response back into primaryEntityData. */
  responseMapping: z
    .object({
      /** dot-path into the response body */
      path: z.string().min(1).max(200),
      /** field name on primaryEntityData to write to */
      assignTo: identifierSchema,
    })
    .optional(),
  /** What to do when the connector fails (HTTP non-2xx or thrown error). */
  onError: z.enum(['halt', 'continue']).default('halt'),
  transitions: z.array(conditionalTransitionSchema).max(20).optional(),
});

const decisionStep = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  kind: z.literal('decision_step'),
  /** Tenant-scoped decision-table id; resolved at runtime. */
  decisionTableId: z.string().uuid(),
  /** Mapping from `primaryEntityData` paths to decision-table input columns. */
  inputs: z.record(z.string(), z.string().min(1)),
  /** Persist all decision outputs onto primaryEntityData under these field names. */
  outputAssignments: z.record(z.string(), identifierSchema).optional(),
  transitions: z.array(conditionalTransitionSchema).max(20).optional(),
});

export const stepSchema = z.discriminatedUnion('kind', [
  formStep,
  approvalStep,
  notificationStep,
  automatedStep,
  connectorStep,
  decisionStep,
]);

export type Step = z.infer<typeof stepSchema>;
export type AssignmentPolicy = z.infer<typeof assignmentPolicySchema>;
export type TransitionTarget = z.infer<typeof transitionTargetSchema>;
export type ConditionalTransition = z.infer<typeof conditionalTransitionSchema>;
export type SendBackTransition = z.infer<typeof sendBackTransitionSchema>;

export const stageSchema = z.object({
  id: z.string().min(1),
  name: humanNameSchema,
  sla: slaSchema.optional(),
  steps: z.array(stepSchema).min(1, 'A stage must contain at least one step.'),
});

export type Stage = z.infer<typeof stageSchema>;

export const caseTypeDefinitionSchema = z
  .object({
    primaryEntityId: z.string().uuid(),
    sla: slaSchema.optional(),
    stages: z.array(stageSchema).min(1, 'A case type must contain at least one stage.'),
  })
  .superRefine((def, ctx) => {
    // Stage and step ids must be unique across the whole definition.
    const stageIds = new Set<string>();
    const stepIds = new Set<string>();
    /** ordering[stepId] = global index, used to enforce send-back precedence. */
    const stepOrder = new Map<string, number>();
    let order = 0;

    def.stages.forEach((stage, sIdx) => {
      if (stageIds.has(stage.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['stages', sIdx, 'id'],
          message: `Duplicate stage id "${stage.id}".`,
        });
      }
      stageIds.add(stage.id);

      stage.steps.forEach((step, stIdx) => {
        if (stepIds.has(step.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['stages', sIdx, 'steps', stIdx, 'id'],
            message: `Duplicate step id "${step.id}".`,
          });
        }
        stepIds.add(step.id);
        stepOrder.set(step.id, order++);
      });
    });

    // Resolve every transition target.
    const resolveTarget = (
      target: z.infer<typeof transitionTargetSchema>,
    ): { ok: true } | { ok: false; reason: string } => {
      if (target.kind === 'resolve') return { ok: true };
      if (target.kind === 'step') {
        return stepIds.has(target.stepId)
          ? { ok: true }
          : { ok: false, reason: `Unknown step id "${target.stepId}".` };
      }
      return stageIds.has(target.stageId)
        ? { ok: true }
        : { ok: false, reason: `Unknown stage id "${target.stageId}".` };
    };

    def.stages.forEach((stage, sIdx) => {
      stage.steps.forEach((step, stIdx) => {
        const path = (...rest: (string | number)[]) => ['stages', sIdx, 'steps', stIdx, ...rest];

        if (step.kind === 'approval_step') {
          for (const targetField of ['approveTarget', 'rejectTarget'] as const) {
            const result = resolveTarget(step[targetField]);
            if (!result.ok) {
              ctx.addIssue({
                code: 'custom',
                path: path(targetField),
                message: result.reason,
              });
            }
          }
        }

        // Conditional transitions exist on every step kind except approval.
        if (step.kind !== 'approval_step') {
          const conditionalTransitions = step.transitions ?? [];
          conditionalTransitions.forEach((t, tIdx) => {
            const result = resolveTarget(t.target);
            if (!result.ok) {
              ctx.addIssue({
                code: 'custom',
                path: path('transitions', tIdx, 'target'),
                message: result.reason,
              });
            }
          });
        }

        // Send-back transitions exist on form_step and approval_step.
        const sendBacks =
          step.kind === 'form_step' || step.kind === 'approval_step' ? step.sendBack ?? [] : [];
        sendBacks.forEach((sb, sbIdx) => {
          const targetOrder = stepOrder.get(sb.targetStepId);
          if (targetOrder == null) {
            ctx.addIssue({
              code: 'custom',
              path: path('sendBack', sbIdx, 'targetStepId'),
              message: `Unknown step id "${sb.targetStepId}".`,
            });
            return;
          }
          const myOrder = stepOrder.get(step.id);
          if (myOrder != null && targetOrder >= myOrder) {
            ctx.addIssue({
              code: 'custom',
              path: path('sendBack', sbIdx, 'targetStepId'),
              message: 'Send-back target must be a step that appears earlier in the case type.',
            });
          }
        });
      });
    });
  });

export type CaseTypeDefinition = z.infer<typeof caseTypeDefinitionSchema>;

export const createCaseTypeInputSchema = z.object({
  name: identifierSchema,
  label: humanNameSchema,
  definition: caseTypeDefinitionSchema,
});

export type CreateCaseTypeInput = z.infer<typeof createCaseTypeInputSchema>;
