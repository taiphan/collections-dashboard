import { describe, it, expect } from 'vitest';
import { designTokensSchema, tokensToCssVariables } from '@/lib/ui/tokens';

describe('design tokens', () => {
  it('accepts known keys and produces CSS variables', () => {
    const tokens = designTokensSchema.parse({
      colors: { primary: '#4f46e5', primaryForeground: '#ffffff' },
      radius: { base: '0.5rem' },
    });
    const css = tokensToCssVariables(tokens) as Record<string, string>;
    expect(css['--primary']).toBe('#4f46e5');
    expect(css['--primary-foreground']).toBe('#ffffff');
    expect(css['--radius']).toBe('0.5rem');
  });

  it('returns empty object when tokens are null', () => {
    expect(tokensToCssVariables(null)).toEqual({});
  });

  it('rejects invalid color values', () => {
    const result = designTokensSchema.safeParse({ colors: { primary: 'not-a-color' } });
    expect(result.success).toBe(false);
  });
});

describe('graph builder', () => {
  it('produces nodes and edges for a minimal case type', async () => {
    const { toFlowGraph } = await import('@/lib/case-runtime/graph');
    const def = {
      primaryEntityId: '11111111-1111-4111-8111-111111111111',
      stages: [
        {
          id: 's1',
          name: 'Intake',
          steps: [
            {
              id: 'p1',
              name: 'Collect',
              kind: 'form_step' as const,
              formId: '22222222-2222-4222-8222-222222222222',
              assignment: { kind: 'specific_role' as const, role: 'case_worker' },
            },
            {
              id: 'p2',
              name: 'Approve',
              kind: 'approval_step' as const,
              assignment: { kind: 'specific_role' as const, role: 'manager' },
              approveTarget: { kind: 'resolve' as const },
              rejectTarget: { kind: 'step' as const, stepId: 'p1' },
            },
          ],
        },
      ],
    };
    const g = toFlowGraph(def);
    expect(g.nodes.find((n) => n.id === 'start')).toBeTruthy();
    expect(g.nodes.find((n) => n.id === 'resolve')).toBeTruthy();
    expect(g.nodes.find((n) => n.id === 'step:p1')).toBeTruthy();
    expect(g.edges.some((e) => e.variant === 'approve')).toBe(true);
    expect(g.edges.some((e) => e.variant === 'reject')).toBe(true);
  });
});
