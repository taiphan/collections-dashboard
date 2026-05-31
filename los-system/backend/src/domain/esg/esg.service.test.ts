import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EsgService } from './esg.service.js';

vi.mock('../../shared/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('EsgService', () => {
  let service: EsgService;

  beforeEach(() => {
    service = new EsgService();
  });

  it('should give high environmental score for electric vehicle', async () => {
    const result = await service.calculateScore({
      customerId: 'cust-1',
      applicationId: 'app-1',
      vehicleType: 'electric',
      renewableEnergy: true,
    });

    expect(result.environmental).toBeGreaterThanOrEqual(60);
    const vehicleFactor = result.factors.find((f) => f.name === 'Vehicle Emissions');
    expect(vehicleFactor).toBeDefined();
    expect(vehicleFactor!.score).toBe(100);
  });

  it('should give ESG grade A or B for green loan purpose', async () => {
    const result = await service.calculateScore({
      customerId: 'cust-2',
      applicationId: 'app-2',
      loanPurpose: 'ev_purchase',
      vehicleType: 'electric',
      renewableEnergy: true,
      socialImpact: true,
      governanceRating: 80,
    });

    expect(['A', 'B']).toContain(result.grade);
    expect(result.overall).toBeGreaterThanOrEqual(60);
  });

  it('should return negative pricingAdjustment (discount) for high ESG score', async () => {
    const result = await service.calculateScore({
      customerId: 'cust-3',
      applicationId: 'app-3',
      loanPurpose: 'green_building',
      vehicleType: 'electric',
      renewableEnergy: true,
      socialImpact: true,
      industry: 'technology',
      governanceRating: 90,
    });

    expect(result.pricingAdjustment).toBeLessThan(0);
  });

  it('should return grade C (neutral) for default inputs', async () => {
    const result = await service.calculateScore({
      customerId: 'cust-4',
      applicationId: 'app-4',
    });

    expect(result.grade).toBe('C');
    expect(result.pricingAdjustment).toBe(0);
  });
});
