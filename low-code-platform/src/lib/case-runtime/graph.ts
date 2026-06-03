/**
 * Convert a CaseTypeDefinition into a node + edge graph for visual rendering.
 *
 * Pure helper, no React. Consumed by the BPMN canvas component (V2.A).
 *
 * Node layout: simple horizontal lanes per stage, steps stacked vertically
 * inside each stage. Sufficient for read-only rendering; an interactive
 * version can layer dagre or elk on top later.
 */

import type {
  CaseTypeDefinition,
  Step,
  TransitionTarget,
} from '@/lib/validation/case-type';
import { findStep, nextStepInOrder } from '@/lib/case-runtime/walker';

export interface FlowNode {
  id: string;
  kind: 'start' | 'stage' | 'step' | 'resolve';
  label: string;
  stepKind?: Step['kind'];
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  variant: 'default' | 'approve' | 'reject' | 'send_back' | 'conditional' | 'fallthrough';
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const STAGE_WIDTH = 260;
const STEP_HEIGHT = 80;
const X_PADDING = 40;
const Y_PADDING = 60;

function targetNodeId(target: TransitionTarget, def: CaseTypeDefinition): string | null {
  if (target.kind === 'resolve') return 'resolve';
  if (target.kind === 'step') {
    const loc = findStep(def, target.stepId);
    return loc ? `step:${loc.step.id}` : null;
  }
  const stage = def.stages.find((s) => s.id === target.stageId);
  if (!stage || stage.steps.length === 0) return null;
  return `step:${stage.steps[0]!.id}`;
}

export function toFlowGraph(def: CaseTypeDefinition): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Start node.
  nodes.push({
    id: 'start',
    kind: 'start',
    label: 'Start',
    position: { x: X_PADDING, y: Y_PADDING },
  });
  nodes.push({
    id: 'resolve',
    kind: 'resolve',
    label: 'Resolve',
    position: {
      x: X_PADDING + (def.stages.length + 1) * STAGE_WIDTH,
      y: Y_PADDING,
    },
  });

  let firstStepNodeId: string | null = null;

  def.stages.forEach((stage, sIdx) => {
    const stageX = X_PADDING + (sIdx + 1) * STAGE_WIDTH;
    nodes.push({
      id: `stage:${stage.id}`,
      kind: 'stage',
      label: stage.name,
      position: { x: stageX, y: Y_PADDING - 40 },
    });

    stage.steps.forEach((step, stIdx) => {
      const nodeId = `step:${step.id}`;
      nodes.push({
        id: nodeId,
        kind: 'step',
        label: step.name,
        stepKind: step.kind,
        position: { x: stageX, y: Y_PADDING + 40 + stIdx * STEP_HEIGHT },
      });
      if (firstStepNodeId == null) firstStepNodeId = nodeId;

      // Approval branches.
      if (step.kind === 'approval_step') {
        const a = targetNodeId(step.approveTarget, def);
        const r = targetNodeId(step.rejectTarget, def);
        if (a) edges.push({ id: `${nodeId}-approve`, source: nodeId, target: a, label: 'approve', variant: 'approve' });
        if (r) edges.push({ id: `${nodeId}-reject`, source: nodeId, target: r, label: 'reject', variant: 'reject' });
      } else {
        const transitions =
          step.kind === 'form_step' ||
          step.kind === 'notification_step' ||
          step.kind === 'automated_step' ||
          step.kind === 'connector_step' ||
          step.kind === 'decision_step'
            ? step.transitions ?? []
            : [];
        transitions.forEach((t, tIdx) => {
          const tgt = targetNodeId(t.target, def);
          if (tgt) {
            edges.push({
              id: `${nodeId}-cond-${tIdx}`,
              source: nodeId,
              target: tgt,
              label: t.label ?? `cond ${tIdx + 1}`,
              variant: 'conditional',
            });
          }
        });
        // Fallthrough next-in-order edge — only when no conditional is present.
        if (transitions.length === 0) {
          const next = nextStepInOrder(def, step.id);
          if (next?.kind === 'resolve') {
            edges.push({ id: `${nodeId}-next`, source: nodeId, target: 'resolve', variant: 'fallthrough' });
          } else if (next?.kind === 'step') {
            edges.push({
              id: `${nodeId}-next`,
              source: nodeId,
              target: `step:${next.step.id}`,
              variant: 'fallthrough',
            });
          } else if (next?.kind === 'stage') {
            edges.push({
              id: `${nodeId}-next`,
              source: nodeId,
              target: `step:${next.step.id}`,
              variant: 'fallthrough',
            });
          }
        }
      }

      // Send-back edges.
      if (step.kind === 'form_step' || step.kind === 'approval_step') {
        for (const sb of step.sendBack ?? []) {
          edges.push({
            id: `${nodeId}-sb-${sb.id}`,
            source: nodeId,
            target: `step:${sb.targetStepId}`,
            label: sb.label,
            variant: 'send_back',
          });
        }
      }
    });
  });

  // Connect start to first step.
  if (firstStepNodeId) {
    edges.push({ id: 'start-first', source: 'start', target: firstStepNodeId, variant: 'default' });
  }

  return { nodes, edges };
}
