import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceService } from './compliance.service.js';

vi.mock('../../infrastructure/database/prisma.js', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn().mockResolvedValue({
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
      }),
    },
    caseActivity: {
      create: vi.fn().mockResolvedValue({ id: 'activity-1' }),
      findMany: vi.fn().mockResolvedValue([]),
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

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ComplianceService();
  });

  it('should pass all checks for normal customer', async () => {
    const result = await service.runFullScreening({
      caseId: 'case-1',
      customerId: 'cust-1',
      customerName: 'John Smith',
      nationalId: 'ID-12345',
      country: 'US',
      screenedBy: 'user-1',
    });

    expect(result.passed).toBe(true);
    expect(result.overallRisk).toBe('LOW');
    expect(result.checks.aml.passed).toBe(true);
    expect(result.checks.sanctions.passed).toBe(true);
  });

  it('should return CRITICAL risk for OFAC-matched name', async () => {
    const result = await service.runFullScreening({
      caseId: 'case-2',
      customerId: 'cust-2',
      customerName: 'TEST OFAC MATCH',
      nationalId: 'ID-99999',
      country: 'US',
      screenedBy: 'user-1',
    });

    expect(result.passed).toBe(false);
    expect(result.overallRisk).toBe('CRITICAL');
    expect(result.checks.sanctions.ofacMatch).toBe(true);
  });

  it('should return HIGH risk for PEP-matched name', async () => {
    const result = await service.runFullScreening({
      caseId: 'case-3',
      customerId: 'cust-3',
      customerName: 'GOVERNMENT OFFICIAL',
      nationalId: 'ID-88888',
      country: 'US',
      screenedBy: 'user-1',
    });

    expect(result.passed).toBe(false);
    expect(result.overallRisk).toBe('HIGH');
    expect(result.checks.sanctions.pepMatch).toBe(true);
  });

  it('should trigger AML flag for high-risk country', async () => {
    const result = await service.runFullScreening({
      caseId: 'case-4',
      customerId: 'cust-4',
      customerName: 'Regular Person',
      nationalId: 'ID-77777',
      country: 'IR', // Iran — high-risk
      screenedBy: 'user-1',
    });

    expect(result.checks.aml.matchedPatterns).toContain('high-risk jurisdiction');
    expect(result.checks.aml.riskScore).toBeGreaterThan(0);
  });
});
