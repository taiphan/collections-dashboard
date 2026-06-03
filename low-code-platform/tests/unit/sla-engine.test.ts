import { describe, it, expect } from 'vitest';
import { computeStatus, statusSortKey } from '@/lib/services/sla-engine';

const baseDate = new Date('2026-01-01T00:00:00Z');

function at(minutesLater: number): Date {
  return new Date(baseDate.getTime() + minutesLater * 60_000);
}

describe('SLA engine — computeStatus', () => {
  it('on_track before warning threshold', () => {
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60, warningMinutes: 30 },
        now: at(15),
      }),
    ).toBe('on_track');
  });

  it('warning at and after warning threshold', () => {
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60, warningMinutes: 30 },
        now: at(30),
      }),
    ).toBe('warning');
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60, warningMinutes: 30 },
        now: at(45),
      }),
    ).toBe('warning');
  });

  it('breached at and after target', () => {
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60, warningMinutes: 30 },
        now: at(60),
      }),
    ).toBe('breached');
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60, warningMinutes: 30 },
        now: at(120),
      }),
    ).toBe('breached');
  });

  it('with no warning threshold, jumps directly from on_track to breached', () => {
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60 },
        now: at(59),
      }),
    ).toBe('on_track');
    expect(
      computeStatus({
        stageEnteredAt: baseDate,
        sla: { targetMinutes: 60 },
        now: at(60),
      }),
    ).toBe('breached');
  });

  it('Property 8: monotonicity through the SLA window', () => {
    const sla = { targetMinutes: 60, warningMinutes: 30 };
    let lastKey = statusSortKey(
      computeStatus({ stageEnteredAt: baseDate, sla, now: at(0) }),
    );
    // statusSortKey: breached=0, warning=1, on_track=2 (lower = worse).
    // For monotonicity going forward in time, the key must be non-increasing.
    for (let m = 0; m <= 90; m += 1) {
      const key = statusSortKey(
        computeStatus({ stageEnteredAt: baseDate, sla, now: at(m) }),
      );
      expect(key).toBeLessThanOrEqual(lastKey);
      lastKey = key;
    }
  });
});
