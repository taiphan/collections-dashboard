'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toFlowGraph, type FlowEdge, type FlowNode } from '@/lib/case-runtime/graph';
import type { CaseTypeDefinition } from '@/lib/validation/case-type';

interface Props {
  definition: CaseTypeDefinition;
}

const variantColor: Record<FlowEdge['variant'], string> = {
  default: 'var(--color-muted-foreground)',
  approve: '#10b981',
  reject: '#ef4444',
  send_back: '#f59e0b',
  conditional: 'var(--color-primary)',
  fallthrough: 'var(--color-muted-foreground)',
};

export function BpmnCanvas({ definition }: Props) {
  const graph = useMemo(() => toFlowGraph(definition), [definition]);

  const nodes: Node[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        position: n.position,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: <NodeLabel node={n} /> },
        type: 'default',
        style: nodeStyle(n),
      })),
    [graph],
  );

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: e.variant === 'conditional' || e.variant === 'send_back',
        style: { stroke: variantColor[e.variant], strokeWidth: 1.5 },
        labelStyle: { fontSize: 11 },
        markerEnd: { type: MarkerType.ArrowClosed, color: variantColor[e.variant] },
      })),
    [graph],
  );

  return (
    <div className="h-[640px] w-full overflow-hidden rounded-xl border border-border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function NodeLabel({ node }: { node: FlowNode }) {
  return (
    <div className="flex flex-col items-start text-left">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {node.kind === 'step' ? node.stepKind?.replace('_', ' ') : node.kind}
      </span>
      <span className="text-sm font-medium text-foreground">{node.label}</span>
    </div>
  );
}

function nodeStyle(n: FlowNode): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 10,
    background: 'var(--color-card)',
    color: 'var(--color-foreground)',
    border: '1px solid var(--color-border)',
    minWidth: 160,
  };
  switch (n.kind) {
    case 'start':
      return { ...base, background: 'var(--color-emerald-500, #10b981)', color: 'white', borderColor: 'transparent' };
    case 'resolve':
      return { ...base, background: 'var(--color-secondary)', color: 'var(--color-foreground)' };
    case 'stage':
      return { ...base, background: 'var(--color-accent)', color: 'var(--color-accent-foreground)', borderStyle: 'dashed' };
    case 'step':
      return n.stepKind === 'approval_step'
        ? { ...base, borderColor: 'var(--color-primary)' }
        : base;
  }
}
