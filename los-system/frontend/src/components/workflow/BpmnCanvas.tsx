import { useRef, useState, useCallback } from 'react';
import type { BpmnNode, BpmnEdge } from './bpmn-types';
import { NODE_DIMENSIONS } from './bpmn-types';

interface BpmnCanvasProps {
  nodes: BpmnNode[];
  edges: BpmnEdge[];
  selectedNode: string | null;
  zoom: number;
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
}

export function BpmnCanvas({
  nodes,
  edges,
  selectedNode,
  zoom,
  onSelectNode,
  onMoveNode,
}: BpmnCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const getNodeCenter = (node: BpmnNode) => {
    const dim = NODE_DIMENSIONS[node.type];
    return { cx: node.x + dim.width / 2, cy: node.y + dim.height / 2 };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const offsetX = (e.clientX - svgRect.left) / zoom - node.x;
    const offsetY = (e.clientY - svgRect.top) / zoom - node.y;

    setDragging({ id: nodeId, offsetX, offsetY });
    onSelectNode(nodeId);
  }, [nodes, zoom, onSelectNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const x = (e.clientX - svgRect.left) / zoom - dragging.offsetX;
    const y = (e.clientY - svgRect.top) / zoom - dragging.offsetY;

    onMoveNode(dragging.id, Math.max(0, x), Math.max(0, y));
  }, [dragging, zoom, onMoveNode]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  // Calculate canvas size
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_DIMENSIONS[n.type].width), 800);
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_DIMENSIONS[n.type].height), 500);

  return (
    <svg
      ref={svgRef}
      width={maxX * zoom + 200}
      height={maxY * zoom + 200}
      className="cursor-default select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Grid pattern */}
      <defs>
        <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
          <path
            d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.3}
            opacity={0.15}
          />
        </pattern>
        {/* Arrow marker */}
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity={0.7} />
        </marker>
        <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
        </marker>
      </defs>

      <rect width="100%" height="100%" fill="url(#grid)" />

      <g transform={`scale(${zoom})`}>
        {/* Edges */}
        {edges.map((edge) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const from = getNodeCenter(fromNode);
          const to = getNodeCenter(toNode);
          const isActive = selectedNode === edge.from || selectedNode === edge.to;

          return (
            <g key={edge.id}>
              <line
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                strokeWidth={isActive ? 2 : 1.5}
                opacity={isActive ? 1 : 0.5}
                markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
              />
              {edge.label && (
                <text
                  x={(from.cx + to.cx) / 2}
                  y={(from.cy + to.cy) / 2 - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground"
                  style={{ fontSize: '10px' }}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <BpmnNodeRenderer
            key={node.id}
            node={node}
            isSelected={selectedNode === node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          />
        ))}
      </g>
    </svg>
  );
}

function BpmnNodeRenderer({
  node,
  isSelected,
  onMouseDown,
}: {
  node: BpmnNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const dim = NODE_DIMENSIONS[node.type];

  return (
    <g
      onMouseDown={onMouseDown}
      className="cursor-grab active:cursor-grabbing"
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={node.x - 4}
          y={node.y - 4}
          width={dim.width + 8}
          height={dim.height + 8}
          rx={node.type === 'task' || node.type === 'subProcess' ? 10 : dim.width / 2 + 4}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.6}
        />
      )}

      {/* Node shape */}
      {renderNodeShape(node, dim)}

      {/* Label */}
      {node.label && (
        <text
          x={node.x + dim.width / 2}
          y={node.type === 'task' || node.type === 'subProcess'
            ? node.y + dim.height / 2 + 4
            : node.y + dim.height + 14}
          textAnchor="middle"
          className="fill-foreground pointer-events-none"
          style={{ fontSize: node.type === 'task' ? '11px' : '10px', fontWeight: 500 }}
        >
          {node.label}
        </text>
      )}

      {/* Task type icon */}
      {node.type === 'task' && node.taskType && (
        <g transform={`translate(${node.x + 6}, ${node.y + 6})`}>
          {renderTaskTypeIcon(node.taskType)}
        </g>
      )}
    </g>
  );
}

function renderNodeShape(node: BpmnNode, dim: { width: number; height: number }) {
  switch (node.type) {
    case 'startEvent':
      return (
        <circle
          cx={node.x + dim.width / 2}
          cy={node.y + dim.height / 2}
          r={dim.width / 2}
          fill="hsl(var(--card))"
          stroke="hsl(142, 76%, 36%)"
          strokeWidth={2}
        />
      );
    case 'endEvent':
      return (
        <circle
          cx={node.x + dim.width / 2}
          cy={node.y + dim.height / 2}
          r={dim.width / 2}
          fill="hsl(var(--card))"
          stroke="hsl(0, 84%, 60%)"
          strokeWidth={3.5}
        />
      );
    case 'timerEvent':
    case 'messageEvent':
      return (
        <>
          <circle
            cx={node.x + dim.width / 2}
            cy={node.y + dim.height / 2}
            r={dim.width / 2}
            fill="hsl(var(--card))"
            stroke="hsl(var(--foreground))"
            strokeWidth={1.5}
          />
          <circle
            cx={node.x + dim.width / 2}
            cy={node.y + dim.height / 2}
            r={dim.width / 2 - 3}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={0.5}
          />
        </>
      );
    case 'task':
      return (
        <rect
          x={node.x}
          y={node.y}
          width={dim.width}
          height={dim.height}
          rx={8}
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
        />
      );
    case 'subProcess':
      return (
        <>
          <rect
            x={node.x}
            y={node.y}
            width={dim.width}
            height={dim.height}
            rx={8}
            fill="hsl(var(--card))"
            stroke="hsl(var(--foreground))"
            strokeWidth={1.5}
          />
          {/* Collapse marker */}
          <rect
            x={node.x + dim.width / 2 - 6}
            y={node.y + dim.height - 10}
            width={12}
            height={8}
            rx={1}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
          />
        </>
      );
    case 'exclusiveGateway':
      return (
        <g>
          <rect
            x={node.x + dim.width / 2 - dim.width / 2}
            y={node.y}
            width={dim.width}
            height={dim.height}
            fill="hsl(var(--card))"
            stroke="hsl(var(--warning))"
            strokeWidth={2}
            transform={`rotate(45, ${node.x + dim.width / 2}, ${node.y + dim.height / 2})`}
          />
          {/* X mark */}
          <path
            d={`M${node.x + dim.width / 2 - 6} ${node.y + dim.height / 2 - 6} l12 12 M${node.x + dim.width / 2 + 6} ${node.y + dim.height / 2 - 6} l-12 12`}
            stroke="hsl(var(--warning))"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );
    case 'parallelGateway':
      return (
        <g>
          <rect
            x={node.x}
            y={node.y}
            width={dim.width}
            height={dim.height}
            fill="hsl(var(--card))"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            transform={`rotate(45, ${node.x + dim.width / 2}, ${node.y + dim.height / 2})`}
          />
          {/* + mark */}
          <path
            d={`M${node.x + dim.width / 2} ${node.y + dim.height / 2 - 8} v16 M${node.x + dim.width / 2 - 8} ${node.y + dim.height / 2} h16`}
            stroke="hsl(var(--foreground))"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );
    default:
      return null;
  }
}

function renderTaskTypeIcon(taskType: string) {
  switch (taskType) {
    case 'user':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'service':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2}>
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'script':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M10 13l-2 2 2 2M14 13l2 2-2 2" />
        </svg>
      );
    case 'send':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2}>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      );
    default:
      return null;
  }
}
