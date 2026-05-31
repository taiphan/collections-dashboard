import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecisionEngineService } from './decision-engine.service.js';

vi.mock('../../infrastructure/database/prisma.js', () => ({
  prisma: {
    decisionRuleSet: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    decision: {
      create: vi.fn().mockResolvedValue({ id: 'dec-1' }),
    },
  },
}));

vi.mock('../../shared/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('DecisionEngineService', () => {
  let service: DecisionEngineService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DecisionEngineService();
  });

  it('should reduce score when DTI exceeds 50%', async () => {
    const result = await service.evaluateApplication(
      'case-1',
      'UNDERWRITING',
      {
        requestedAmount: 100000,
        requestedTenure: 360,
        monthlyIncome: 5000,
        existingDebt: 3000, // DTI = 60%
        creditScore: 700,
      },
    );

    expect(result.score).toBeLessThan(100);
    const dtiRule = result.reasoning.find((r) => r.rule === 'DTI Ratio Check');
    expect(dtiRule).toBeDefined();
    expect(dtiRule!.impact).toBeLessThan(0);
  });

  it('should give bonus for excellent credit score (750+)', async () => {
    const result = await service.evaluateApplication(
      'case-2',
      'CREDIT_CHECK',
      {
        requestedAmount: 50000,
        requestedTenure: 60,
        monthlyIncome: 10000,
        existingDebt: 1000,
        creditScore: 780,
      },
    );

    const creditRule = result.reasoning.find((r) => r.rule === 'Credit Score');
    expect(creditRule).toBeDefined();
    expect(creditRule!.result).toBe('Excellent');
    expect(creditRule!.impact).toBe(10);
  });

  it('should result in REJECTED for low credit score (<500)', async () => {
    const result = await service.evaluateApplication(
      'case-3',
      'CREDIT_CHECK',
      {
        requestedAmount: 50000,
        requestedTenure: 60,
        monthlyIncome: 5000,
        existingDebt: 2500, // DTI = 50% → -40
        creditScore: 450,   // Poor → -50
      },
    );

    expect(result.outcome).toBe('REJECTED');
    const creditRule = result.reasoning.find((r) => r.rule === 'Credit Score');
    expect(creditRule).toBeDefined();
    expect(creditRule!.impact).toBe(-50);
  });

  it('should result in CONDITIONAL for moderate score (50-70)', async () => {
    // Craft context that produces a score between 50-70
    // Start at 100, credit score 580 = -20, elevated DTI = -15 → score = 65
    const result = await service.evaluateApplication(
      'case-4',
      'UNDERWRITING',
      {
        requestedAmount: 30000,
        requestedTenure: 60,
        monthlyIncome: 8000,
        existingDebt: 3200, // DTI = 40% (elevated, 36-43%)
        creditScore: 580, // Fair = -20
      },
    );

    expect(result.outcome).toBe('CONDITIONAL');
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(70);
  });
});
