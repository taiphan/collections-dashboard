import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet } from '../../infrastructure/cache/redis.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'reporting-service' });
const CACHE_TTL = 120; // 2 minutes for dashboard data

export interface PipelineReport {
  totalApplications: number;
  totalActive: number;
  byStage: Array<{ stage: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byProduct: Array<{ productType: string; count: number; totalAmount: number }>;
  conversionRate: number;
  avgProcessingDays: number;
}

export interface TatReport {
  overall: { avgHours: number; medianHours: number; p95Hours: number };
  byStage: Array<{
    stage: string;
    avgHours: number;
    minHours: number;
    maxHours: number;
    count: number;
  }>;
}

export interface OfficerPerformance {
  officerId: string;
  officerName: string;
  activeCases: number;
  completedThisMonth: number;
  avgProcessingHours: number;
  slaBreachRate: number;
}

export interface PortfolioSummary {
  totalDisbursed: number;
  totalAmount: number;
  byProduct: Array<{ productType: string; count: number; amount: number }>;
  approvalRate: number;
  rejectionRate: number;
  avgLoanAmount: number;
}

export class ReportingService {
  async getPipelineReport(): Promise<PipelineReport> {
    const cached = await cacheGet<PipelineReport>('los:report:pipeline');
    if (cached) return cached;

    const [
      totalApplications,
      totalActive,
      byStage,
      byStatus,
      byProduct,
      approved,
      completed,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.case.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } } }),
      prisma.case.groupBy({
        by: ['currentStage'],
        where: { status: { not: 'COMPLETED' } },
        _count: true,
      }),
      prisma.case.groupBy({ by: ['status'], _count: true }),
      prisma.application.groupBy({
        by: ['productId'],
        _count: true,
        _sum: { requestedAmount: true },
      }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({
        where: { status: { in: ['APPROVED', 'REJECTED', 'DISBURSED'] } },
      }),
    ]);

    // Calculate avg processing time from completed cases
    const completedCases = await prisma.case.findMany({
      where: { status: 'COMPLETED', completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
      take: 100,
      orderBy: { completedAt: 'desc' },
    });

    const avgProcessingMs = completedCases.length > 0
      ? completedCases.reduce((sum, c) => {
          return sum + (c.completedAt!.getTime() - c.startedAt.getTime());
        }, 0) / completedCases.length
      : 0;

    const report: PipelineReport = {
      totalApplications,
      totalActive,
      byStage: byStage.map((s) => ({ stage: s.currentStage, count: s._count })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byProduct: byProduct.map((p) => ({
        productType: p.productId,
        count: p._count,
        totalAmount: Number(p._sum.requestedAmount || 0),
      })),
      conversionRate: completed > 0 ? (approved / completed) * 100 : 0,
      avgProcessingDays: avgProcessingMs / (1000 * 60 * 60 * 24),
    };

    await cacheSet('los:report:pipeline', report, CACHE_TTL);
    return report;
  }

  async getTatReport(): Promise<TatReport> {
    const cached = await cacheGet<TatReport>('los:report:tat');
    if (cached) return cached;

    // Get stage durations from history
    const stageHistory = await prisma.stageHistory.findMany({
      where: { duration: { not: null } },
      select: { fromStage: true, duration: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Group by stage
    const stageGroups: Record<string, number[]> = {};
    for (const entry of stageHistory) {
      if (!stageGroups[entry.fromStage]) {
        stageGroups[entry.fromStage] = [];
      }
      stageGroups[entry.fromStage].push(entry.duration! / 60); // Convert to hours
    }

    const byStage = Object.entries(stageGroups).map(([stage, durations]) => {
      durations.sort((a, b) => a - b);
      return {
        stage,
        avgHours: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10,
        minHours: Math.round(durations[0] * 10) / 10,
        maxHours: Math.round(durations[durations.length - 1] * 10) / 10,
        count: durations.length,
      };
    });

    const allDurations = stageHistory
      .filter((s) => s.duration)
      .map((s) => s.duration! / 60);
    allDurations.sort((a, b) => a - b);

    const overall = {
      avgHours: allDurations.length > 0
        ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length * 10) / 10
        : 0,
      medianHours: allDurations.length > 0
        ? Math.round(allDurations[Math.floor(allDurations.length / 2)] * 10) / 10
        : 0,
      p95Hours: allDurations.length > 0
        ? Math.round(allDurations[Math.floor(allDurations.length * 0.95)] * 10) / 10
        : 0,
    };

    const report: TatReport = { overall, byStage };
    await cacheSet('los:report:tat', report, CACHE_TTL);
    return report;
  }

  async getOfficerPerformance(): Promise<OfficerPerformance[]> {
    const cached = await cacheGet<OfficerPerformance[]>('los:report:officers');
    if (cached) return cached;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const officers = await prisma.user.findMany({
      where: { role: { in: ['LOAN_OFFICER', 'UNDERWRITER'] }, isActive: true },
      include: {
        assignedCases: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } },
        },
      },
    });

    const performance: OfficerPerformance[] = [];

    for (const officer of officers) {
      const completedThisMonth = await prisma.case.count({
        where: {
          assignedTo: officer.id,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
      });

      const breachedCases = await prisma.case.count({
        where: {
          assignedTo: officer.id,
          slaBreached: true,
          createdAt: { gte: startOfMonth },
        },
      });

      const totalCasesThisMonth = await prisma.case.count({
        where: {
          assignedTo: officer.id,
          createdAt: { gte: startOfMonth },
        },
      });

      // Avg processing time for completed cases
      const completedCases = await prisma.case.findMany({
        where: {
          assignedTo: officer.id,
          status: 'COMPLETED',
          completedAt: { not: null },
        },
        select: { startedAt: true, completedAt: true },
        take: 20,
        orderBy: { completedAt: 'desc' },
      });

      const avgHours = completedCases.length > 0
        ? completedCases.reduce((sum, c) => {
            return sum + (c.completedAt!.getTime() - c.startedAt.getTime()) / 3600000;
          }, 0) / completedCases.length
        : 0;

      performance.push({
        officerId: officer.id,
        officerName: `${officer.firstName} ${officer.lastName}`,
        activeCases: officer.assignedCases.length,
        completedThisMonth,
        avgProcessingHours: Math.round(avgHours * 10) / 10,
        slaBreachRate: totalCasesThisMonth > 0
          ? Math.round((breachedCases / totalCasesThisMonth) * 100)
          : 0,
      });
    }

    await cacheSet('los:report:officers', performance, CACHE_TTL);
    return performance;
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const cached = await cacheGet<PortfolioSummary>('los:report:portfolio');
    if (cached) return cached;

    const [disbursed, approved, rejected, allCompleted] = await Promise.all([
      prisma.application.findMany({
        where: { status: 'DISBURSED' },
        include: { product: { select: { productType: true } } },
      }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({
        where: { status: { in: ['APPROVED', 'REJECTED', 'DISBURSED'] } },
      }),
    ]);

    const totalAmount = disbursed.reduce((sum, app) => sum + Number(app.requestedAmount), 0);

    // Group by product type
    const productGroups: Record<string, { count: number; amount: number }> = {};
    for (const app of disbursed) {
      const type = app.product.productType;
      if (!productGroups[type]) productGroups[type] = { count: 0, amount: 0 };
      productGroups[type].count++;
      productGroups[type].amount += Number(app.requestedAmount);
    }

    const summary: PortfolioSummary = {
      totalDisbursed: disbursed.length,
      totalAmount,
      byProduct: Object.entries(productGroups).map(([type, data]) => ({
        productType: type,
        ...data,
      })),
      approvalRate: allCompleted > 0 ? Math.round(((approved + disbursed.length) / allCompleted) * 100) : 0,
      rejectionRate: allCompleted > 0 ? Math.round((rejected / allCompleted) * 100) : 0,
      avgLoanAmount: disbursed.length > 0 ? Math.round(totalAmount / disbursed.length) : 0,
    };

    await cacheSet('los:report:portfolio', summary, CACHE_TTL);
    return summary;
  }
}

export const reportingService = new ReportingService();
