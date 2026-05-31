import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet } from '../../infrastructure/cache/redis.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'pre-screening' });
const CACHE_TTL = 30 * 24 * 3600; // 30 days

export interface PreScreeningRequest {
  productId: string;
  applicantData: {
    age?: number;
    monthlyIncome?: number;
    employmentStatus?: string;
    existingDebt?: number;
    creditScore?: number;
  };
  consentForBureauCheck: boolean;
  consentForOpenBanking: boolean;
}

export interface PreScreeningResult {
  id: string;
  eligible: boolean;
  score: number;
  maxEligibleAmount: number;
  indicativeRate: number;
  indicativeMonthlyPayment: number;
  reasons: string[];
  dataSourcesUsed: string[];
  validUntil: Date;
  createdAt: Date;
}

export class PreScreeningService {
  async runPreScreening(request: PreScreeningRequest): Promise<PreScreeningResult> {
    const product = await prisma.loanProduct.findUnique({
      where: { id: request.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('LoanProduct', request.productId);
    }

    const { applicantData } = request;
    const dataSources: string[] = ['internal'];
    let score = 50; // Base score
    const reasons: string[] = [];

    // Age check
    const eligibility = product.eligibilityCriteria as Record<string, number> | null;
    if (eligibility) {
      if (eligibility.minAge && applicantData.age && applicantData.age < eligibility.minAge) {
        score -= 50;
        reasons.push(`Minimum age requirement: ${eligibility.minAge}`);
      }
      if (eligibility.maxAge && applicantData.age && applicantData.age > eligibility.maxAge) {
        score -= 50;
        reasons.push(`Maximum age limit: ${eligibility.maxAge}`);
      }
      if (eligibility.minIncome && applicantData.monthlyIncome &&
          applicantData.monthlyIncome < eligibility.minIncome) {
        score -= 30;
        reasons.push(`Minimum income requirement: $${eligibility.minIncome}/month`);
      }
    }

    // Income-based scoring
    if (applicantData.monthlyIncome) {
      if (applicantData.monthlyIncome >= 10000) score += 20;
      else if (applicantData.monthlyIncome >= 5000) score += 10;
      else if (applicantData.monthlyIncome >= 3000) score += 5;
    }

    // Employment stability
    if (applicantData.employmentStatus === 'full_time') score += 10;
    else if (applicantData.employmentStatus === 'self_employed') score += 5;
    else if (applicantData.employmentStatus === 'unemployed') score -= 20;

    // Existing debt burden
    if (applicantData.existingDebt && applicantData.monthlyIncome) {
      const debtRatio = applicantData.existingDebt / (applicantData.monthlyIncome * 12);
      if (debtRatio > 0.5) {
        score -= 20;
        reasons.push('High existing debt relative to income');
      } else if (debtRatio > 0.3) {
        score -= 10;
        reasons.push('Moderate existing debt level');
      }
    }

    // Bureau check (simulated)
    if (request.consentForBureauCheck) {
      dataSources.push('bureau');
      if (applicantData.creditScore) {
        if (applicantData.creditScore >= 750) score += 15;
        else if (applicantData.creditScore >= 650) score += 5;
        else if (applicantData.creditScore < 550) {
          score -= 25;
          reasons.push('Credit score below threshold');
        }
      } else {
        // Simulate bureau pull
        score += 5;
      }
    }

    // Open Banking (simulated enrichment)
    if (request.consentForOpenBanking) {
      dataSources.push('openBanking');
      score += 5; // Bonus for providing Open Banking data
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Calculate max eligible amount based on score and income
    const eligible = score >= 40;
    let maxEligibleAmount = 0;
    let indicativeRate = Number(product.baseInterestRate);

    if (eligible && applicantData.monthlyIncome) {
      const maxMonthlyPayment = applicantData.monthlyIncome * 0.35;
      const existingPayments = (applicantData.existingDebt || 0) / 60;
      const availablePayment = Math.max(0, maxMonthlyPayment - existingPayments);

      // Calculate max amount from available payment (simplified)
      const monthlyRate = indicativeRate / 12;
      const defaultTenure = product.maxTenureMonths;
      maxEligibleAmount = availablePayment *
        (Math.pow(1 + monthlyRate, defaultTenure) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, defaultTenure));

      // Cap at product max
      maxEligibleAmount = Math.min(maxEligibleAmount, Number(product.maxAmount));
      maxEligibleAmount = Math.max(0, Math.round(maxEligibleAmount));

      // Risk-based rate adjustment
      if (score >= 80) indicativeRate -= 0.005;
      else if (score < 50) indicativeRate += 0.02;
    }

    const indicativeMonthlyPayment = maxEligibleAmount > 0
      ? this.calculateMonthlyPayment(maxEligibleAmount, indicativeRate, product.maxTenureMonths)
      : 0;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const result: PreScreeningResult = {
      id: crypto.randomUUID(),
      eligible,
      score,
      maxEligibleAmount,
      indicativeRate: Math.round(indicativeRate * 10000) / 10000,
      indicativeMonthlyPayment: Math.round(indicativeMonthlyPayment * 100) / 100,
      reasons: eligible ? [] : reasons,
      dataSourcesUsed: dataSources,
      validUntil,
      createdAt: new Date(),
    };

    // Cache result
    await cacheSet(`los:prescreen:${result.id}`, result, CACHE_TTL);

    log.info(
      { resultId: result.id, eligible, score, maxAmount: maxEligibleAmount },
      'Pre-screening completed',
    );

    return result;
  }

  async getResult(resultId: string): Promise<PreScreeningResult | null> {
    return cacheGet<PreScreeningResult>(`los:prescreen:${resultId}`);
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) return principal / months;
    return principal *
      (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }
}

export const preScreeningService = new PreScreeningService();
