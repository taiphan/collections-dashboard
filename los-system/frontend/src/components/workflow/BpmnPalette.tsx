import type { BpmnNodeType } from './bpmn-types';

interface BpmnPaletteProps {
  onAddNode: (type: BpmnNodeType) => void;
}

const PALETTE_GROUPS = [
  {
    label: 'Events',
    items: [
      { type: 'startEvent' as BpmnNodeType, label: 'Start', icon: StartEventIcon },
      { type: 'endEvent' as BpmnNodeType, label: 'End', icon: EndEventIcon },
      { type: 'timerEvent' as BpmnNodeType, label: 'Timer', icon: TimerEventIcon },
      { type: 'messageEvent' as BpmnNodeType, label: 'Message', icon: MessageEventIcon },
    ],
  },
  {
    label: 'Activities',
    items: [
      { type: 'task' as BpmnNodeType, label: 'Task', icon: TaskIcon },
      { type: 'subProcess' as BpmnNodeType, label: 'Sub-Process', icon: SubProcessIcon },
    ],
  },
  {
    label: 'Gateways',
    items: [
      { type: 'exclusiveGateway' as BpmnNodeType, label: 'Exclusive', icon: ExclusiveGwIcon },
      { type: 'parallelGateway' as BpmnNodeType, label: 'Parallel', icon: ParallelGwIcon },
    ],
  },
];

export function BpmnPalette({ onAddNode }: BpmnPaletteProps) {
  return (
    <div className="w-[180px] shrink-0 bg-card border-r p-3 space-y-4 overflow-y-auto">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Elements
      </p>

      {PALETTE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => onAddNode(item.type)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  title={`Add ${item.label}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-3 border-t">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Click an element to add it to the canvas. Select elements on canvas to edit properties.
        </p>
      </div>
    </div>
  );
}

// BPMN-standard SVG icons
function StartEventIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="3" fill="hsl(142, 76%, 36%)" />
    </svg>
  );
}

function EndEventIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={3} />
      <circle cx="12" cy="12" r="5" fill="hsl(0, 84%, 60%)" />
    </svg>
  );
}

function TimerEventIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" />
    </svg>
  );
}

function MessageEventIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 9h10v6H7z" />
      <path d="M7 9l5 3.5L17 9" />
    </svg>
  );
}

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h10M7 14h6" strokeLinecap="round" />
    </svg>
  );
}

function SubProcessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <rect x="9" y="17" width="6" height="4" rx="1" fill="currentColor" opacity={0.3} />
      <path d="M12 17v2M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function ExclusiveGwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2l10 10-10 10L2 12z" />
      <path d="M9 9l6 6M15 9l-6 6" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function ParallelGwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2l10 10-10 10L2 12z" />
      <path d="M12 7v10M7 12h10" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
