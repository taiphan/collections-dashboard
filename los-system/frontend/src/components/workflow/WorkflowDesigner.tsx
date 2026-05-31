import { useState, useCallback } from 'react';
import { BpmnCanvas } from './BpmnCanvas';
import { BpmnPalette } from './BpmnPalette';
import { BpmnProperties } from './BpmnProperties';
import type { BpmnNode, BpmnEdge, BpmnNodeType } from './bpmn-types';

// Pre-built workflow templates
const TEMPLATES: Record<string, { name: string; nodes: BpmnNode[]; edges: BpmnEdge[] }> = {
  personal: {
    name: 'Personal Loan',
    nodes: [
      { id: 'start', type: 'startEvent', label: 'Application Received', x: 60, y: 200 },
      { id: 't1', type: 'task', label: 'Data Validation', x: 200, y: 200, taskType: 'service' },
      { id: 'g1', type: 'exclusiveGateway', label: 'Complete?', x: 360, y: 200 },
      { id: 't2', type: 'task', label: 'Request Info', x: 360, y: 340, taskType: 'user' },
      { id: 't3', type: 'task', label: 'KYC Verification', x: 500, y: 200, taskType: 'service' },
      { id: 't4', type: 'task', label: 'Credit Bureau Pull', x: 660, y: 200, taskType: 'service' },
      { id: 'g2', type: 'parallelGateway', label: '', x: 820, y: 200 },
      { id: 't5', type: 'task', label: 'Risk Assessment', x: 820, y: 80, taskType: 'script' },
      { id: 't6', type: 'task', label: 'Affordability Check', x: 820, y: 320, taskType: 'script' },
      { id: 'g3', type: 'parallelGateway', label: '', x: 980, y: 200 },
      { id: 't7', type: 'task', label: 'Underwriting Decision', x: 1120, y: 200, taskType: 'user' },
      { id: 'g4', type: 'exclusiveGateway', label: 'Approved?', x: 1280, y: 200 },
      { id: 't8', type: 'task', label: 'Generate Offer', x: 1420, y: 140, taskType: 'service' },
      { id: 't9', type: 'task', label: 'Send Rejection', x: 1420, y: 280, taskType: 'send' },
      { id: 't10', type: 'task', label: 'Document Signing', x: 1580, y: 140, taskType: 'user' },
      { id: 't11', type: 'task', label: 'Disbursement', x: 1740, y: 140, taskType: 'service' },
      { id: 'end1', type: 'endEvent', label: 'Loan Disbursed', x: 1880, y: 140 },
      { id: 'end2', type: 'endEvent', label: 'Rejected', x: 1560, y: 280 },
    ],
    edges: [
      { id: 'e1', from: 'start', to: 't1' },
      { id: 'e2', from: 't1', to: 'g1' },
      { id: 'e3', from: 'g1', to: 't3', label: 'Yes' },
      { id: 'e4', from: 'g1', to: 't2', label: 'No' },
      { id: 'e5', from: 't2', to: 't1' },
      { id: 'e6', from: 't3', to: 't4' },
      { id: 'e7', from: 't4', to: 'g2' },
      { id: 'e8', from: 'g2', to: 't5' },
      { id: 'e9', from: 'g2', to: 't6' },
      { id: 'e10', from: 't5', to: 'g3' },
      { id: 'e11', from: 't6', to: 'g3' },
      { id: 'e12', from: 'g3', to: 't7' },
      { id: 'e13', from: 't7', to: 'g4' },
      { id: 'e14', from: 'g4', to: 't8', label: 'Approve' },
      { id: 'e15', from: 'g4', to: 't9', label: 'Reject' },
      { id: 'e16', from: 't8', to: 't10' },
      { id: 'e17', from: 't10', to: 't11' },
      { id: 'e18', from: 't11', to: 'end1' },
      { id: 'e19', from: 't9', to: 'end2' },
    ],
  },
};

export function WorkflowDesigner() {
  const [nodes, setNodes] = useState<BpmnNode[]>(TEMPLATES.personal.nodes);
  const [edges, setEdges] = useState<BpmnEdge[]>(TEMPLATES.personal.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Personal Loan Standard');
  const [zoom, setZoom] = useState(1);

  const handleAddNode = useCallback((type: BpmnNodeType) => {
    const newNode: BpmnNode = {
      id: `node-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      x: 400 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      taskType: type === 'task' ? 'user' : undefined,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode.id);
  }, []);

  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, x, y } : n));
  }, []);

  const handleNodeUpdate = useCallback((id: string, updates: Partial<BpmnNode>) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedNode(null);
  }, []);

  const handleLoadTemplate = (key: string) => {
    const template = TEMPLATES[key];
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
      setWorkflowName(template.name);
      setSelectedNode(null);
    }
  };

  const selected = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-card border rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BpmnIcon className="w-5 h-5 text-primary" />
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-48"
            />
          </div>
          <div className="w-px h-5 bg-border" />
          <span className="text-[11px] text-muted-foreground">
            {nodes.length} elements · {edges.length} connections
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted rounded-md px-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="text-[11px] font-medium w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Template selector */}
          <select
            onChange={(e) => handleLoadTemplate(e.target.value)}
            className="text-[12px] px-2 py-1 border rounded-md bg-background"
            defaultValue=""
          >
            <option value="" disabled>Load Template...</option>
            <option value="personal">Personal Loan</option>
          </select>

          <button className="px-3 py-1.5 text-[12px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Save & Deploy
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex border-x border-b rounded-b-lg overflow-hidden">
        {/* Palette */}
        <BpmnPalette onAddNode={handleAddNode} />

        {/* Canvas */}
        <div className="flex-1 relative bg-[hsl(var(--muted))] overflow-auto">
          <BpmnCanvas
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            zoom={zoom}
            onSelectNode={setSelectedNode}
            onMoveNode={handleNodeMove}
          />
        </div>

        {/* Properties panel */}
        {selected && (
          <BpmnProperties
            node={selected}
            onUpdate={(updates) => handleNodeUpdate(selected.id, updates)}
            onDelete={() => handleDeleteNode(selected.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}

function getDefaultLabel(type: BpmnNodeType): string {
  switch (type) {
    case 'startEvent': return 'Start';
    case 'endEvent': return 'End';
    case 'task': return 'New Task';
    case 'exclusiveGateway': return 'Decision';
    case 'parallelGateway': return '';
    case 'timerEvent': return 'Timer';
    case 'messageEvent': return 'Message';
    case 'subProcess': return 'Sub-Process';
    default: return 'Element';
  }
}

function BpmnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="4" cy="12" r="2.5" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
      <circle cx="20" cy="12" r="2.5" strokeWidth={3} />
      <path d="M6.5 12h2.5M15 12h2.5" />
    </svg>
  );
}
