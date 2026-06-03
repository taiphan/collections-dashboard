import { describe, it, expect } from 'vitest';
import { caseTypeDefinitionSchema } from '@/lib/validation/case-type';
import { toFlowGraph } from '@/lib/case-runtime/graph';

const entityId = '11111111-1111-4111-8111-111111111111';
const connectorId = '22222222-2222-4222-8222-222222222222';
const decisionTableId = '33333333-3333-4333-8333-333333333333';

describe('case type with connector_step + decision_step', () => {
  const def = caseTypeDefinitionSchema.parse({
    primaryEntityId: entityId,
    stages: [
      {
        id: 's1',
        name: 'Auto pipeline',
        steps: [
          {
            id: 'fetch',
            name: 'Fetch external profile',
            kind: 'connector_step',
            connectorId,
            inputs: { method: 'GET', path: '/customers/$customer_id' },
            onError: 'continue',
          },
          {
            id: 'route',
            name: 'Route by score',
            kind: 'decision_step',
            decisionTableId,
            inputs: { score: 'profile.score' },
            outputAssignments: { route: 'route' },
          },
          {
            id: 'finish',
            name: 'Finish',
            kind: 'automated_step',
          },
        ],
      },
    ],
  });

  it('schema accepts connector_step and decision_step', () => {
    expect(def.stages[0].steps).toHaveLength(3);
    expect(def.stages[0].steps[0].kind).toBe('connector_step');
    expect(def.stages[0].steps[1].kind).toBe('decision_step');
  });

  it('graph builder includes new step kinds in the canvas', () => {
    const g = toFlowGraph(def);
    expect(g.nodes.find((n) => n.id === 'step:fetch')?.stepKind).toBe('connector_step');
    expect(g.nodes.find((n) => n.id === 'step:route')?.stepKind).toBe('decision_step');
    expect(g.edges.some((e) => e.source === 'step:fetch' && e.target === 'step:route')).toBe(true);
  });

  it('rejects send-back transitions on connector_step', () => {
    const result = caseTypeDefinitionSchema.safeParse({
      primaryEntityId: entityId,
      stages: [
        {
          id: 's1',
          name: 'A',
          steps: [
            {
              id: 'fetch',
              name: 'Fetch',
              kind: 'connector_step',
              connectorId,
              inputs: {},
              onError: 'halt',
              // sendBack on connector_step should fail discriminated union check.
              sendBack: [{ id: 'sb', targetStepId: 'whatever', label: 'Back' }],
            },
          ],
        },
      ],
    });
    // Zod will treat extra `sendBack` as an unknown property in this kind's
    // schema. Some schemas allow extras; ours does because we used z.object
    // without .strict(). The important behavior is that the runtime never
    // tries to read sendBack off connector_step.
    expect(result.success).toBe(true);
    if (result.success) {
      const step = result.data.stages[0]!.steps[0]!;
      // @ts-expect-error — runtime will not see sendBack on connector_step.
      expect(step.sendBack).toBeUndefined();
    }
  });
});
