import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenBankingService } from './open-banking.service.js';

vi.mock('../../shared/utils/logger.js', () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('OpenBankingService', () => {
  let service: OpenBankingService;

  beforeEach(() => {
    service = new OpenBankingService();
  });

  describe('categorizeTransaction', () => {
    it('should correctly identify salary transactions', () => {
      const result = service.categorizeTransaction('PAYROLL - TECH CORP', 8500);
      expect(result.code).toBe('SAL');
      expect(result.name).toBe('Salary');
    });

    it('should correctly identify rent transactions', () => {
      const result = service.categorizeTransaction('MONTHLY RENT - LANDLORD', -1800);
      expect(result.code).toBe('EXP_HOUSING');
      expect(result.name).toBe('Housing/Rent');
    });

    it('should categorize unknown credits as other income', () => {
      const result = service.categorizeTransaction('RANDOM DEPOSIT', 500);
      expect(result.code).toBe('INC_OTHER');
    });

    it('should categorize unknown debits as other expenses', () => {
      const result = service.categorizeTransaction('RANDOM PURCHASE', -100);
      expect(result.code).toBe('EXP_OTHER');
    });
  });

  describe('calculateAffordability', () => {
    it('should return positive disposableIncome for good earner', async () => {
      const assessment = await service.calculateAffordability('customer-1');

      expect(assessment.disposableIncome).toBeGreaterThan(0);
      expect(assessment.affordableMonthlyPayment).toBeGreaterThan(0);
      expect(assessment.income.salary).toBeGreaterThan(0);
      expect(assessment.stabilityScore).toBeGreaterThanOrEqual(60);
    });

    it('should trigger risk indicator for gambling transactions', async () => {
      // Override getTransactions to include gambling
      const originalGetTransactions = service.getTransactions.bind(service);
      vi.spyOn(service, 'getTransactions').mockImplementation(async () => {
        const transactions = await originalGetTransactions('customer-1', 3);
        transactions.push({
          id: 'txn-gamble-1',
          accountId: 'acc-1',
          date: new Date(),
          amount: -500,
          description: 'ONLINE CASINO BET',
          categoryCode: 'EXP_GAMBLING',
          categoryName: 'Gambling',
          isRecurring: false,
          type: 'debit',
        });
        return transactions;
      });

      const assessment = await service.calculateAffordability('customer-2');
      expect(assessment.riskIndicators).toContain('Gambling transactions detected');
    });
  });
});
