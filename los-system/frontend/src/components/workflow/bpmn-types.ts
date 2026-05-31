export type BpmnNodeType =
  | 'startEvent'
  | 'endEvent'
  | 'task'
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'timerEvent'
  | 'messageEvent'
  | 'subProcess';

export type TaskType = 'user' | 'service' | 'script' | 'send' | 'receive' | 'manual';

export interface BpmnNode {
  id: string;
  type: BpmnNodeType;
  label: string;
  x: number;
  y: number;
  taskType?: TaskType;
  description?: string;
  assignee?: string;
  slaHours?: number;
}

export interface BpmnEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export const NODE_DIMENSIONS: Record<BpmnNodeType, { width: number; height: number }> = {
  startEvent: { width: 36, height: 36 },
  endEvent: { width: 36, height: 36 },
  task: { width: 140, height: 60 },
  exclusiveGateway: { width: 44, height: 44 },
  parallelGateway: { width: 44, height: 44 },
  timerEvent: { width: 36, height: 36 },
  messageEvent: { width: 36, height: 36 },
  subProcess: { width: 160, height: 80 },
};
