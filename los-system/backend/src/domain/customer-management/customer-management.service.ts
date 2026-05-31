import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet } from '../../infrastructure/cache/redis.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'customer-management' });
const CACHE_TTL = 300; // 5 minutes

// Types
export interface CustomerHealthScore {
  customerId: string;
  overallScore: number;
  paymentBehavior: number;
  financialStability: number;
  engagementLevel: number;
  riskTrend: 'improving' | 'stable' | 'deteriorating';
  alerts: EarlyWarningAlert[];
}

export interface EarlyWarningAlert {
  id: string;
  customerId: string;
  type: 'payment_delay' | 'income_drop' | 'high_utilization' | 'adverse_event' | 'behavioral_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  triggeredAt: Date;
  resolved: boolean;
  recommendedAction: string;
}

export interface PortfolioMetrics {
  totalCustomers: number;
  totalExposure: number;
  atRiskCount: number;
  healthDistribution: { healthy: number; watch: number; concern: number; critical: number };
  avgHealthScore: number;
}

interface AlertFilters {
  severity?: string;
  type?: string;
  resolved?: boolean;
  customerId?: string;
}

interface TimelineEvent {
  id: string;
  customerId: string;
  event: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class CustomerManagementService {
  async calculateHealthScore(customerId: string): Promise<CustomerHealthScore> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    // Simulate composite scoring
    const paymentBehavior = 60 + Math.random() * 40; // 60-100
    const financialStability = 50 + Math.random() * 50; // 50-100
    const engagementLevel = 40 + Math.random() * 60; // 40-100

    const overallScore = Math.round(
      paymentBehavior * 0.4 + financialStability * 0.35 + engagementLevel * 0.25,
    );

    // Determine trend based on score
    let riskTrend: 'improving' | 'stable' | 'deteriorating';
    if (overallScore >= 75) riskTrend = 'improving';
    else if (overallScore >= 50) riskTrend = 'stable';
    else riskTrend = 'deteriorating';

    // Run early warning check inline
    const alerts = this.generateAlerts(customerId, overallScore);

    const healthScore: CustomerHealthScore = {
      customerId,
      overallScore,
      paymentBehavior: Math.round(paymentBehavior),
      financialStability: Math.round(financialStability),
      engagementLevel: Math.round(engagementLevel),
      riskTrend,
      alerts,
    };

    await cacheSet(`los:health:${customerId}`, healthScore, CACHE_TTL);

    log.info(
      { customerId, overallScore, riskTrend, alertCount: alerts.length },
      'Health score calculated',
    );

    return healthScore;
  }

  async runEarlyWarningCheck(customerId: string): Promise<EarlyWarningAlert[]> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    const cached = await cacheGet<CustomerHealthScore>(`los:health:${customerId}`);
    const score = cached?.overallScore ?? 70;

    const alerts = this.generateAlerts(customerId, score);

    // Store alerts in cache
    const existingAlerts = await cacheGet<EarlyWarningAlert[]>(`los:alerts:${customerId}`) || [];
    const allAlerts = [...existingAlerts, ...alerts];
    await cacheSet(`los:alerts:${customerId}`, allAlerts, CACHE_TTL * 12);

    log.info({ customerId, newAlerts: alerts.length }, 'Early warning check completed');

    return alerts;
  }

  async getAlerts(filters: AlertFilters): Promise<EarlyWarningAlert[]> {
    // Simulate fetching alerts — in production this would query a DB table
    const sampleAlerts: EarlyWarningAlert[] = [
      {
        id: crypto.randomUUID(),
        customerId: filters.customerId || 'cust-001',
        type: 'payment_delay',
        severity: 'high',
        description: 'Payment overdue by 15 days on loan #LN-2024-001',
        triggeredAt: new Date(Date.now() - 2 * 86400000),
        resolved: false,
        recommendedAction: 'Contact customer via phone, offer payment plan',
      },
      {
        id: crypto.randomUUID(),
        customerId: filters.customerId || 'cust-002',
        type: 'income_drop',
        severity: 'medium',
        description: 'Monthly income decreased by 25% based on bank statements',
        triggeredAt: new Date(Date.now() - 5 * 86400000),
        resolved: false,
        recommendedAction: 'Schedule financial review meeting',
      },
      {
        id: crypto.randomUUID(),
        customerId: filters.customerId || 'cust-003',
        type: 'high_utilization',
        severity: 'low',
        description: 'Credit utilization reached 85% across all facilities',
        triggeredAt: new Date(Date.now() - 1 * 86400000),
        resolved: false,
        recommendedAction: 'Monitor for 30 days, consider limit review',
      },
      {
        id: crypto.randomUUID(),
        customerId: filters.customerId || 'cust-004',
        type: 'adverse_event',
        severity: 'critical',
        description: 'Bankruptcy filing detected in public records',
        triggeredAt: new Date(Date.now() - 0.5 * 86400000),
        resolved: false,
        recommendedAction: 'Immediate escalation to risk committee',
      },
      {
        id: crypto.randomUUID(),
        customerId: filters.customerId || 'cust-005',
        type: 'behavioral_change',
        severity: 'medium',
        description: 'Unusual transaction pattern detected — multiple cash advances',
        triggeredAt: new Date(Date.now() - 3 * 86400000),
        resolved: true,
        recommendedAction: 'Review transaction history, update risk profile',
      },
    ];

    let filtered = sampleAlerts;

    if (filters.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity);
    }
    if (filters.type) {
      filtered = filtered.filter((a) => a.type === filters.type);
    }
    if (filters.resolved !== undefined) {
      filtered = filtered.filter((a) => a.resolved === filters.resolved);
    }

    return filtered;
  }

  async resolveAlert(alertId: string, resolution: string): Promise<{ success: boolean; alertId: string; resolution: string }> {
    log.info({ alertId, resolution }, 'Alert resolved');

    return {
      success: true,
      alertId,
      resolution,
    };
  }

  async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    const totalCustomers = await prisma.customer.count();

    // Simulate portfolio metrics
    const totalExposure = totalCustomers * 45000 + Math.random() * 500000;
    const atRiskCount = Math.max(1, Math.floor(totalCustomers * 0.12));
    const avgHealthScore = 68 + Math.random() * 15;

    const healthy = Math.floor(totalCustomers * 0.55);
    const watch = Math.floor(totalCustomers * 0.25);
    const concern = Math.floor(totalCustomers * 0.13);
    const critical = Math.max(1, totalCustomers - healthy - watch - concern);

    const metrics: PortfolioMetrics = {
      totalCustomers: Math.max(totalCustomers, 1),
      totalExposure: Math.round(totalExposure),
      atRiskCount,
      healthDistribution: { healthy, watch, concern, critical },
      avgHealthScore: Math.round(avgHealthScore * 10) / 10,
    };

    log.info({ totalCustomers: metrics.totalCustomers, avgHealthScore: metrics.avgHealthScore }, 'Portfolio metrics calculated');

    return metrics;
  }

  async getCustomerTimeline(customerId: string): Promise<TimelineEvent[]> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    // Simulate timeline events
    const now = Date.now();
    const timeline: TimelineEvent[] = [
      {
        id: crypto.randomUUID(),
        customerId,
        event: 'customer_created',
        description: 'Customer record created during onboarding',
        timestamp: new Date(now - 90 * 86400000),
      },
      {
        id: crypto.randomUUID(),
        customerId,
        event: 'kyc_verified',
        description: 'KYC verification completed successfully',
        timestamp: new Date(now - 89 * 86400000),
      },
      {
        id: crypto.randomUUID(),
        customerId,
        event: 'loan_application',
        description: 'Personal loan application submitted — $25,000',
        timestamp: new Date(now - 85 * 86400000),
        metadata: { amount: 25000, product: 'Personal Loan' },
      },
      {
        id: crypto.randomUUID(),
        customerId,
        event: 'loan_approved',
        description: 'Loan application approved and disbursed',
        timestamp: new Date(now - 80 * 86400000),
      },
      {
        id: crypto.randomUUID(),
        customerId,
        event: 'payment_received',
        description: 'Monthly payment received — $520.00',
        timestamp: new Date(now - 50 * 86400000),
        metadata: { amount: 520 },
      },
      {
        id: crypto.randomUUID(),
        customerId,
        event: 'health_check',
        description: 'Automated health score assessment — Score: 78',
        timestamp: new Date(now - 10 * 86400000),
        metadata: { score: 78 },
      },
    ];

    return timeline;
  }

  private generateAlerts(customerId: string, score: number): EarlyWarningAlert[] {
    const alerts: EarlyWarningAlert[] = [];

    if (score < 50) {
      alerts.push({
        id: crypto.randomUUID(),
        customerId,
        type: 'payment_delay',
        severity: 'high',
        description: 'Payment behavior score indicates potential default risk',
        triggeredAt: new Date(),
        resolved: false,
        recommendedAction: 'Initiate proactive outreach and offer restructuring options',
      });
    }

    if (score < 40) {
      alerts.push({
        id: crypto.randomUUID(),
        customerId,
        type: 'adverse_event',
        severity: 'critical',
        description: 'Customer health score critically low — immediate attention required',
        triggeredAt: new Date(),
        resolved: false,
        recommendedAction: 'Escalate to senior relationship manager immediately',
      });
    }

    if (Math.random() < 0.3) {
      alerts.push({
        id: crypto.randomUUID(),
        customerId,
        type: 'behavioral_change',
        severity: 'low',
        description: 'Minor change in transaction patterns detected',
        triggeredAt: new Date(),
        resolved: false,
        recommendedAction: 'Monitor for next 30 days',
      });
    }

    return alerts;
  }
}

export const customerManagementService = new CustomerManagementService();
