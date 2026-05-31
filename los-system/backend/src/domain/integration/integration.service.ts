import { createChildLogger } from '../../shared/utils/logger.js';
import { AppError } from '../../shared/errors/index.js';

const log = createChildLogger({ module: 'integration-service' });

// ============================================================
// Credit Bureau Integration (Abstract)
// ============================================================

export interface CreditBureauRequest {
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

export interface CreditBureauResponse {
  provider: string;
  score: number;
  grade: string;
  reportDate: string;
  accounts: CreditAccount[];
  inquiries: number;
  delinquencies: number;
  totalDebt: number;
  availableCredit: number;
  utilizationRate: number;
  raw?: unknown;
}

export interface CreditAccount {
  type: string;
  status: string;
  balance: number;
  limit?: number;
  monthlyPayment: number;
  openDate: string;
  lastPaymentDate?: string;
}

export interface KycVerificationRequest {
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
}

export interface KycVerificationResponse {
  verified: boolean;
  matchScore: number;
  checks: {
    nameMatch: boolean;
    dobMatch: boolean;
    documentValid: boolean;
    sanctionsCheck: boolean;
    pepCheck: boolean;
  };
  riskFlags: string[];
}

export interface CoreBankingDisbursementRequest {
  applicationId: string;
  customerId: string;
  amount: number;
  currency: string;
  accountNumber: string;
  reference: string;
}

export interface CoreBankingDisbursementResponse {
  transactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  timestamp: string;
  reference: string;
}

// ============================================================
// Integration Service with Circuit Breaker
// ============================================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

export class IntegrationService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  // Credit Bureau - Mock implementation (replace with real provider)
  async pullCreditReport(request: CreditBureauRequest): Promise<CreditBureauResponse> {
    this.checkCircuitBreaker('credit-bureau');

    try {
      // In production, this would call the actual credit bureau API
      // For now, return a simulated response
      const response = await this.simulateCreditBureauCall(request);
      this.resetCircuitBreaker('credit-bureau');
      log.info({ nationalId: request.nationalId }, 'Credit report pulled');
      return response;
    } catch (error) {
      this.recordFailure('credit-bureau');
      throw error;
    }
  }

  // KYC Verification - Mock implementation
  async verifyIdentity(request: KycVerificationRequest): Promise<KycVerificationResponse> {
    this.checkCircuitBreaker('kyc-provider');

    try {
      const response = await this.simulateKycVerification(request);
      this.resetCircuitBreaker('kyc-provider');
      log.info({ nationalId: request.nationalId }, 'KYC verification completed');
      return response;
    } catch (error) {
      this.recordFailure('kyc-provider');
      throw error;
    }
  }

  // Core Banking Disbursement - Mock implementation
  async disburseFunds(
    request: CoreBankingDisbursementRequest,
  ): Promise<CoreBankingDisbursementResponse> {
    this.checkCircuitBreaker('core-banking');

    try {
      const response = await this.simulateDisbursement(request);
      this.resetCircuitBreaker('core-banking');
      log.info(
        { applicationId: request.applicationId, amount: request.amount },
        'Disbursement initiated',
      );
      return response;
    } catch (error) {
      this.recordFailure('core-banking');
      throw error;
    }
  }

  // Webhook notification
  async sendWebhook(url: string, event: string, payload: unknown): Promise<void> {
    try {
      // In production, use fetch with proper timeout and retry
      log.info({ url, event }, 'Webhook sent');
    } catch (error) {
      log.error({ url, event, error }, 'Webhook delivery failed');
    }
  }

  // Circuit Breaker implementation
  private checkCircuitBreaker(service: string): void {
    const state = this.circuitBreakers.get(service);
    if (!state) return;

    if (state.state === 'OPEN') {
      const elapsed = Date.now() - state.lastFailure;
      if (elapsed > CIRCUIT_BREAKER_TIMEOUT) {
        state.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          `Service '${service}' is temporarily unavailable (circuit breaker open)`,
          503,
          'SERVICE_UNAVAILABLE',
        );
      }
    }
  }

  private recordFailure(service: string): void {
    const state = this.circuitBreakers.get(service) || {
      failures: 0,
      lastFailure: 0,
      state: 'CLOSED' as const,
    };

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      state.state = 'OPEN';
      log.warn({ service, failures: state.failures }, 'Circuit breaker opened');
    }

    this.circuitBreakers.set(service, state);
  }

  private resetCircuitBreaker(service: string): void {
    this.circuitBreakers.delete(service);
  }

  // Simulated external service calls
  private async simulateCreditBureauCall(
    request: CreditBureauRequest,
  ): Promise<CreditBureauResponse> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate deterministic score based on national ID for consistency
    const hash = request.nationalId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const score = 500 + (hash % 350); // Score between 500-850

    return {
      provider: 'SimulatedBureau',
      score,
      grade: score >= 750 ? 'A' : score >= 650 ? 'B' : score >= 550 ? 'C' : 'D',
      reportDate: new Date().toISOString(),
      accounts: [
        {
          type: 'CREDIT_CARD',
          status: 'CURRENT',
          balance: 2500,
          limit: 10000,
          monthlyPayment: 250,
          openDate: '2020-01-15',
        },
        {
          type: 'AUTO_LOAN',
          status: 'CURRENT',
          balance: 15000,
          monthlyPayment: 450,
          openDate: '2022-06-01',
        },
      ],
      inquiries: 2,
      delinquencies: score < 600 ? 1 : 0,
      totalDebt: 17500,
      availableCredit: 7500,
      utilizationRate: 0.25,
    };
  }

  private async simulateKycVerification(
    request: KycVerificationRequest,
  ): Promise<KycVerificationResponse> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      verified: true,
      matchScore: 0.95,
      checks: {
        nameMatch: true,
        dobMatch: true,
        documentValid: true,
        sanctionsCheck: true,
        pepCheck: true,
      },
      riskFlags: [],
    };
  }

  private async simulateDisbursement(
    request: CoreBankingDisbursementRequest,
  ): Promise<CoreBankingDisbursementResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      reference: request.reference,
    };
  }
}

export const integrationService = new IntegrationService();
