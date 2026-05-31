import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreScreeningService } from './pre-screening.service.js';

vi.mock('../../infrastructure/database/prisma.js', () => ({
  prisma: {
    loanProduct: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../infrastructure/cache/redis.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../shared/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from '../../infrastructure/database/prisma.js';

const mockProduct = {
  id: 'prod-1',
  isActive: true,
  baseInterestRate: 0.065,
  maxAmount: 500000,
  maxTenureMonths: 360,
  eligibilityCriteria: {
    minAge: 21,
    maxAge: 65,
    minIncome: 3000,
  },
};

describe('PreScreeningService', () => {
  let service: PreScreeningService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PreScreeningService();
    vi.mocked(prisma.loanProduct.findUnique).mockResolvedValue(mockProduct as never);
  });

  it('should return eligible=true for applicant with good income', async () => {
    const result = await service.runPreScreening({
      productId: 'prod-1',
      applicantData: {
        age: 35,
        monthlyIncome: 10000,
        employmentStatus: 'full_time',
        existingDebt: 5000,
        creditScore: 750,
      },
      consentForBureauCheck: true,
      consentForOpenBanking: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.maxEligibleAmount).toBeGreaterThan(0);
  });

  it('should return eligible=false with reason when below min age', async () => {
    const result = await service.runPreScreening({
      productId: 'prod-1',
      applicantData: {
        age: 18,
        monthlyIncome: 5000,
        employmentStatus: 'full_time',
      },
      consentForBureauCheck: false,
      consentForOpenBanking: false,
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('Minimum age requirement: 21');
  });

  it('should reduce score for high debt ratio', async () => {
    const highDebtResult = await service.runPreScreening({
      productId: 'prod-1',
      applicantData: {
        age: 35,
        monthlyIncome: 5000,
        employmentStatus: 'full_time',
        existingDebt: 50000, // debt > 50% of annual income
      },
      consentForBureauCheck: false,
      consentForOpenBanking: false,
    });

    const lowDebtResult = await service.runPreScreening({
      productId: 'prod-1',
      applicantData: {
        age: 35,
        monthlyIncome: 5000,
        employmentStatus: 'full_time',
        existingDebt: 1000,
      },
      consentForBureauCheck: false,
      consentForOpenBanking: false,
    });

    expect(highDebtResult.score).toBeLessThan(lowDebtResult.score);
  });

  it('should add bureau to dataSourcesUsed when consent given', async () => {
    const result = await service.runPreScreening({
      productId: 'prod-1',
      applicantData: {
        age: 30,
        monthlyIncome: 6000,
        employmentStatus: 'full_time',
        creditScore: 700,
      },
      consentForBureauCheck: true,
      consentForOpenBanking: false,
    });

    expect(result.dataSourcesUsed).toContain('bureau');
  });

  it('should cap maxEligibleAmount at product max', async () => {
    const result = await service.runPreScreening({
      productId: 'prod-1',
      applicantData: {
        age: 40,
        monthlyIncome: 100000, // Very high income
        employmentStatus: 'full_time',
        existingDebt: 0,
        creditScore: 800,
      },
      consentForBureauCheck: true,
      consentForOpenBanking: true,
    });

    expect(result.maxEligibleAmount).toBeLessThanOrEqual(mockProduct.maxAmount);
  });
});
