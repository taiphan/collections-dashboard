import type { BpmnNode, TaskType } from './bpmn-types';

interface BpmnPropertiesProps {
  node: BpmnNode;
  onUpdate: (updates: Partial<BpmnNode>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const TASK_TYPES: Array<{ value: TaskType; label: string; icon: string }> = [
  { value: 'user', label: 'User Task', icon: '👤' },
  { value: 'service', label: 'Service Task', icon: '⚙️' },
  { value: 'script', label: 'Script Task', icon: '📜' },
  { value: 'send', label: 'Send Task', icon: '📤' },
  { value: 'receive', label: 'Receive Task', icon: '📥' },
  { value: 'manual', label: 'Manual Task', icon: '✋' },
];

export function BpmnProperties({ node, onUpdate, onDelete, onClose }: BpmnPropertiesProps) {
  return (
    <div className="w-[260px] shrink-0 bg-card border-l p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">Properties</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Node type badge */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
          {formatNodeType(node.type)}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">{node.id}</span>
      </div>

      {/* Label */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">Label</label>
        <input
          value={node.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-2.5 py-1.5 text-[12px] border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Task type (only for tasks) */}
      {node.type === 'task' && (
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Task Type</label>
          <select
            value={node.taskType || 'user'}
            onChange={(e) => onUpdate({ taskType: e.target.value as TaskType })}
            className="w-full px-2.5 py-1.5 text-[12px] border rounded-md bg-background"
          >
            {TASK_TYPES.map((tt) => (
              <option key={tt.value} value={tt.value}>
                {tt.icon} {tt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">Description</label>
        <textarea
          value={node.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-2.5 py-1.5 text-[12px] border rounded-md bg-background resize-none"
          rows={3}
          placeholder="Describe this element..."
        />
      </div>

      {/* Assignee (for user tasks) */}
      {node.type === 'task' && node.taskType === 'user' && (
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Assignee</label>
          <input
            value={node.assignee || ''}
            onChange={(e) => onUpdate({ assignee: e.target.value })}
            className="w-full px-2.5 py-1.5 text-[12px] border rounded-md bg-background"
            placeholder="Role or user..."
          />
        </div>
      )}

      {/* SLA */}
      {node.type === 'task' && (
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">SLA (hours)</label>
          <input
            type="number"
            value={node.slaHours || ''}
            onChange={(e) => onUpdate({ slaHours: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-2.5 py-1.5 text-[12px] border rounded-md bg-background"
            placeholder="e.g. 24"
            min={0}
          />
        </div>
      )}

      {/* Position */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">X:</span>
            <input
              type="number"
              value={Math.round(node.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="w-full px-2 py-1 text-[11px] border rounded bg-background"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Y:</span>
            <input
              type="number"
              value={Math.round(node.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="w-full px-2 py-1 text-[11px] border rounded bg-background"
            />
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="pt-3 border-t">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium text-destructive bg-destructive/10 rounded-md hover:bg-destructive/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Element
        </button>
      </div>
    </div>
  );
}

function formatNodeType(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
