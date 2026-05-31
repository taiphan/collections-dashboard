import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet } from '../../infrastructure/cache/redis.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'collection' });
const CACHE_TTL = 600; // 10 minutes

// Types
export interface CollectionCase {
  id: string;
  customerId: string;
  loanId: string;
  status: 'new' | 'contacted' | 'promise_to_pay' | 'arrangement' | 'escalated' | 'legal' | 'recovered' | 'written_off';
  strategy: 'soft' | 'medium' | 'hard' | 'legal';
  totalOverdue: number;
  daysOverdue: number;
  contactAttempts: number;
  lastContactDate?: Date;
  nextActionDate: Date;
  assignedTo?: string;
  selfCureProbability: number;
}

export interface CollectionStrategy {
  segment: string;
  actions: Array<{ day: number; channel: 'sms' | 'email' | 'call' | 'letter'; template: string }>;
}

export interface RecoveryMetrics {
  totalCases: number;
  totalOverdue: number;
  recoveredAmount: number;
  recoveryRate: number;
  avgDaysToResolve: number;
  byStrategy: Array<{ strategy: string; cases: number; recoveryRate: number }>;
}

interface ContactRecord {
  caseId: string;
  channel: string;
  outcome: string;
  timestamp: Date;
  notes?: string;
}

interface PaymentArrangement {
  caseId: string;
  totalAmount: number;
  installments: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  status: 'active' | 'completed' | 'defaulted';
}

interface CaseFilters {
  status?: string;
  strategy?: string;
  assignedTo?: string;
  minDaysOverdue?: number;
  page?: number;
  limit?: number;
}

const STRATEGY_ACTIONS: Record<string, CollectionStrategy> = {
  soft: {
    segment: 'low_risk',
    actions: [
      { day: 1, channel: 'sms', template: 'friendly_reminder' },
      { day: 5, channel: 'email', template: 'payment_reminder' },
      { day: 10, channel: 'sms', template: 'second_reminder' },
      { day: 15, channel: 'call', template: 'courtesy_call' },
    ],
  },
  medium: {
    segment: 'medium_risk',
    actions: [
      { day: 1, channel: 'sms', template: 'payment_overdue' },
      { day: 3, channel: 'call', template: 'collection_call' },
      { day: 7, channel: 'email', template: 'formal_notice' },
      { day: 14, channel: 'call', template: 'escalation_warning' },
      { day: 21, channel: 'letter', template: 'demand_letter' },
    ],
  },
  hard: {
    segment: 'high_risk',
    actions: [
      { day: 1, channel: 'call', template: 'immediate_contact' },
      { day: 2, channel: 'sms', template: 'urgent_payment' },
      { day: 5, channel: 'letter', template: 'formal_demand' },
      { day: 10, channel: 'call', template: 'final_notice' },
      { day: 15, channel: 'letter', template: 'legal_warning' },
    ],
  },
  legal: {
    segment: 'legal_action',
    actions: [
      { day: 1, channel: 'letter', template: 'legal_notice' },
      { day: 7, channel: 'letter', template: 'court_filing_notice' },
    ],
  },
};

export class CollectionService {
  async createCollectionCase(
    customerId: string,
    loanId: string,
    overdueAmount: number,
    daysOverdue: number,
  ): Promise<CollectionCase> {
    if (overdueAmount <= 0) {
      throw new ValidationError('Overdue amount must be positive');
    }
    if (daysOverdue <= 0) {
      throw new ValidationError('Days overdue must be positive');
    }

    const strategy = this.determineStrategy(daysOverdue, overdueAmount);
    const selfCureProbability = this.calculateSelfCureProbability(daysOverdue, overdueAmount);

    const nextActionDate = new Date();
    nextActionDate.setDate(nextActionDate.getDate() + 1);

    const collectionCase: CollectionCase = {
      id: crypto.randomUUID(),
      customerId,
      loanId,
      status: 'new',
      strategy,
      totalOverdue: overdueAmount,
      daysOverdue,
      contactAttempts: 0,
      nextActionDate,
      selfCureProbability,
    };

    await cacheSet(`los:collection:${collectionCase.id}`, collectionCase, CACHE_TTL * 6);

    // Add to case list
    const caseList = await cacheGet<string[]>('los:collection:cases') || [];
    caseList.push(collectionCase.id);
    await cacheSet('los:collection:cases', caseList, CACHE_TTL * 6);

    log.info(
      { caseId: collectionCase.id, customerId, strategy, daysOverdue, overdueAmount },
      'Collection case created',
    );

    return collectionCase;
  }

  async predictSelfCure(caseId: string): Promise<{ caseId: string; probability: number; factors: Record<string, number> }> {
    const collectionCase = await this.getCase(caseId);

    // Simulate ML prediction
    const baseProbability = this.calculateSelfCureProbability(
      collectionCase.daysOverdue,
      collectionCase.totalOverdue,
    );

    const factors: Record<string, number> = {
      daysOverdue: collectionCase.daysOverdue <= 15 ? 0.3 : -0.2,
      overdueAmount: collectionCase.totalOverdue < 5000 ? 0.2 : -0.15,
      previousPaymentHistory: 0.25 + Math.random() * 0.2,
      contactResponsiveness: collectionCase.contactAttempts < 3 ? 0.15 : -0.1,
      seasonalFactor: 0.05,
    };

    log.info({ caseId, probability: baseProbability }, 'Self-cure prediction generated');

    return {
      caseId,
      probability: baseProbability,
      factors,
    };
  }

  async assignStrategy(caseId: string): Promise<{ caseId: string; strategy: string; actions: CollectionStrategy['actions'] }> {
    const collectionCase = await this.getCase(caseId);

    const strategy = this.determineStrategy(collectionCase.daysOverdue, collectionCase.totalOverdue);
    collectionCase.strategy = strategy;

    await cacheSet(`los:collection:${caseId}`, collectionCase, CACHE_TTL * 6);

    const strategyConfig = STRATEGY_ACTIONS[strategy];

    log.info({ caseId, strategy }, 'Strategy assigned');

    return {
      caseId,
      strategy,
      actions: strategyConfig.actions,
    };
  }

  async recordContact(
    caseId: string,
    channel: string,
    outcome: string,
  ): Promise<ContactRecord> {
    const collectionCase = await this.getCase(caseId);

    collectionCase.contactAttempts += 1;
    collectionCase.lastContactDate = new Date();

    // Update status based on outcome
    if (outcome === 'promise_to_pay') {
      collectionCase.status = 'promise_to_pay';
    } else if (outcome === 'no_answer' && collectionCase.contactAttempts >= 5) {
      collectionCase.status = 'escalated';
    } else if (collectionCase.status === 'new') {
      collectionCase.status = 'contacted';
    }

    // Set next action date
    const nextAction = new Date();
    nextAction.setDate(nextAction.getDate() + (outcome === 'promise_to_pay' ? 7 : 3));
    collectionCase.nextActionDate = nextAction;

    await cacheSet(`los:collection:${caseId}`, collectionCase, CACHE_TTL * 6);

    const record: ContactRecord = {
      caseId,
      channel,
      outcome,
      timestamp: new Date(),
    };

    log.info(
      { caseId, channel, outcome, attempts: collectionCase.contactAttempts },
      'Contact recorded',
    );

    return record;
  }

  async createArrangement(
    caseId: string,
    plan: { totalAmount: number; installments: number; frequency: 'weekly' | 'biweekly' | 'monthly'; startDate: string },
  ): Promise<PaymentArrangement> {
    const collectionCase = await this.getCase(caseId);

    collectionCase.status = 'arrangement';
    await cacheSet(`los:collection:${caseId}`, collectionCase, CACHE_TTL * 6);

    const arrangement: PaymentArrangement = {
      caseId,
      totalAmount: plan.totalAmount,
      installments: plan.installments,
      frequency: plan.frequency,
      startDate: new Date(plan.startDate),
      status: 'active',
    };

    await cacheSet(`los:collection:arrangement:${caseId}`, arrangement, CACHE_TTL * 12);

    log.info(
      { caseId, installments: plan.installments, totalAmount: plan.totalAmount },
      'Payment arrangement created',
    );

    return arrangement;
  }

  async getRecoveryMetrics(): Promise<RecoveryMetrics> {
    // Simulate portfolio-level recovery stats
    const totalCases = 150 + Math.floor(Math.random() * 50);
    const totalOverdue = totalCases * 3500 + Math.random() * 100000;
    const recoveredAmount = totalOverdue * (0.45 + Math.random() * 0.2);
    const recoveryRate = (recoveredAmount / totalOverdue) * 100;

    const metrics: RecoveryMetrics = {
      totalCases,
      totalOverdue: Math.round(totalOverdue),
      recoveredAmount: Math.round(recoveredAmount),
      recoveryRate: Math.round(recoveryRate * 10) / 10,
      avgDaysToResolve: Math.round(25 + Math.random() * 20),
      byStrategy: [
        { strategy: 'soft', cases: Math.floor(totalCases * 0.4), recoveryRate: 72.5 },
        { strategy: 'medium', cases: Math.floor(totalCases * 0.3), recoveryRate: 58.3 },
        { strategy: 'hard', cases: Math.floor(totalCases * 0.2), recoveryRate: 41.2 },
        { strategy: 'legal', cases: Math.floor(totalCases * 0.1), recoveryRate: 28.7 },
      ],
    };

    log.info(
      { totalCases, recoveryRate: metrics.recoveryRate },
      'Recovery metrics calculated',
    );

    return metrics;
  }

  async listCases(filters: CaseFilters): Promise<{ cases: CollectionCase[]; total: number }> {
    // Generate sample cases for demonstration
    const sampleCases: CollectionCase[] = Array.from({ length: 12 }, (_, i) => ({
      id: crypto.randomUUID(),
      customerId: `cust-${String(i + 1).padStart(3, '0')}`,
      loanId: `loan-${String(i + 1).padStart(3, '0')}`,
      status: (['new', 'contacted', 'promise_to_pay', 'arrangement', 'escalated'] as const)[i % 5],
      strategy: (['soft', 'medium', 'hard', 'legal'] as const)[i % 4],
      totalOverdue: 1000 + Math.floor(Math.random() * 20000),
      daysOverdue: 5 + Math.floor(Math.random() * 90),
      contactAttempts: Math.floor(Math.random() * 8),
      lastContactDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 86400000) : undefined,
      nextActionDate: new Date(Date.now() + Math.random() * 7 * 86400000),
      assignedTo: Math.random() > 0.2 ? `officer-${(i % 3) + 1}` : undefined,
      selfCureProbability: Math.round(Math.random() * 80),
    }));

    let filtered = sampleCases;

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }
    if (filters.strategy) {
      filtered = filtered.filter((c) => c.strategy === filters.strategy);
    }
    if (filters.minDaysOverdue) {
      filtered = filtered.filter((c) => c.daysOverdue >= (filters.minDaysOverdue || 0));
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return { cases: paginated, total: filtered.length };
  }

  private async getCase(caseId: string): Promise<CollectionCase> {
    const collectionCase = await cacheGet<CollectionCase>(`los:collection:${caseId}`);
    if (!collectionCase) {
      throw new NotFoundError('CollectionCase', caseId);
    }
    return collectionCase;
  }

  private determineStrategy(daysOverdue: number, overdueAmount: number): CollectionCase['strategy'] {
    if (daysOverdue > 90 || overdueAmount > 50000) return 'legal';
    if (daysOverdue > 60 || overdueAmount > 20000) return 'hard';
    if (daysOverdue > 30 || overdueAmount > 10000) return 'medium';
    return 'soft';
  }

  private calculateSelfCureProbability(daysOverdue: number, overdueAmount: number): number {
    // Simulated ML model output
    let probability = 80;

    if (daysOverdue > 60) probability -= 40;
    else if (daysOverdue > 30) probability -= 25;
    else if (daysOverdue > 15) probability -= 10;

    if (overdueAmount > 20000) probability -= 20;
    else if (overdueAmount > 10000) probability -= 10;
    else if (overdueAmount > 5000) probability -= 5;

    // Add some randomness
    probability += Math.random() * 10 - 5;

    return Math.max(5, Math.min(95, Math.round(probability)));
  }
}

export const collectionService = new CollectionService();
