/**
 * SLA Engine — pure status computation. Server-side wall-clock only
 * (Requirement 9.5; the runtime + worker call this with `new Date()`).
 *
 * Property 8 (SLA monotonicity): for fixed inputs, increasing `now` only
 * advances status forward through `on_track → warning → breached`.
 */

export interface SlaSpec {
  targetMinutes: number;
  warningMinutes?: number;
}

export type SlaStatus = 'on_track' | 'warning' | 'breached';

export interface SlaComputeInput {
  /** When the case entered the stage being measured. */
  stageEnteredAt: Date;
  /** SLA spec defined on the stage or case-type. */
  sla: SlaSpec;
  /** Override "now" for testing. */
  now?: Date;
}

export function computeStatus({ stageEnteredAt, sla, now }: SlaComputeInput): SlaStatus {
  const at = now ?? new Date();
  const elapsedMs = at.getTime() - stageEnteredAt.getTime();
  const elapsedMinutes = elapsedMs / 60000;
  const target = sla.targetMinutes;
  const warning = sla.warningMinutes;

  if (elapsedMinutes >= target) return 'breached';
  if (warning != null && elapsedMinutes >= warning) return 'warning';
  return 'on_track';
}

/**
 * Sort SLA statuses by "trouble" so worklist filters can return breached
 * first. Ordered: breached > warning > on_track.
 */
export function statusSortKey(s: SlaStatus): number {
  switch (s) {
    case 'breached':
      return 0;
    case 'warning':
      return 1;
    case 'on_track':
      return 2;
  }
}
