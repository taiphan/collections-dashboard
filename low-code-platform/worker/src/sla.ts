/**
 * Local copy of the SLA computation so the worker doesn't drag the entire
 * application module graph into its own runtime. Keep in sync with
 * src/lib/services/sla-engine.ts (Property 8).
 */

export interface SlaSpec {
  targetMinutes: number;
  warningMinutes?: number;
}

export type SlaStatus = 'on_track' | 'warning' | 'breached';

export function computeStatus(input: { stageEnteredAt: Date; sla: SlaSpec; now?: Date }): SlaStatus {
  const at = input.now ?? new Date();
  const elapsedMinutes = (at.getTime() - input.stageEnteredAt.getTime()) / 60000;
  const target = input.sla.targetMinutes;
  const warning = input.sla.warningMinutes;
  if (elapsedMinutes >= target) return 'breached';
  if (warning != null && elapsedMinutes >= warning) return 'warning';
  return 'on_track';
}
