import { prisma } from '../../infrastructure/database/prisma.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { BusinessRuleError } from '../../shared/errors/index.js';

const log = createChildLogger({ module: 'analytics-service' });

export interface MovingAverageData {
  window: number;
  data: { date: string; importAvg: number; exportAvg: number }[];
}

export interface ProductRanking {
  skuId: string;
  skuCode: string;
  productName: string;
  totalExported: number;
}

export interface TurnoverData {
  skuId: string;
  skuCode: string;
  productName: string;
  turnoverRate: number | null;
  totalExported: number;
  avgInventory: number;
}

export interface TrendData {
  slope: number;
  intercept: number;
  dataPoints: { date: string; value: number }[];
  trendLine: { date: string; value: number }[];
}

export class AnalyticsService {
  async getMovingAverages(windowDays: number): Promise<MovingAverageData> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays - 30);

    const operations = await prisma.warehouseOperation.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: startDate, lte: endDate },
      },
      include: { lineItems: true },
      orderBy: { approvedAt: 'asc' },
    });

    // Group by date
    const dailyData: Record<string, { imports: number; exports: number }> = {};

    for (const op of operations) {
      const dateKey = op.approvedAt!.toISOString().split('T')[0];
      if (!dailyData[dateKey]) dailyData[dateKey] = { imports: 0, exports: 0 };

      const totalQty = op.lineItems.reduce((sum, li) => sum + li.quantity, 0);
      if (op.type === 'IMPORT') {
        dailyData[dateKey].imports += totalQty;
      } else {
        dailyData[dateKey].exports += totalQty;
      }
    }

    // Calculate moving averages
    const dates = Object.keys(dailyData).sort();
    const result: { date: string; importAvg: number; exportAvg: number }[] = [];

    for (let i = windowDays - 1; i < dates.length; i++) {
      let importSum = 0;
      let exportSum = 0;

      for (let j = i - windowDays + 1; j <= i; j++) {
        const d = dailyData[dates[j]] || { imports: 0, exports: 0 };
        importSum += d.imports;
        exportSum += d.exports;
      }

      result.push({
        date: dates[i],
        importAvg: Math.round((importSum / windowDays) * 100) / 100,
        exportAvg: Math.round((exportSum / windowDays) * 100) / 100,
      });
    }

    log.debug({ windowDays, dataPoints: result.length }, 'Moving averages calculated');
    return { window: windowDays, data: result };
  }

  async getTopProducts(days: number, limit: number = 10): Promise<{ top: ProductRanking[]; bottom: ProductRanking[] }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await prisma.operationLineItem.groupBy({
      by: ['skuId'],
      where: {
        operation: {
          type: 'EXPORT',
          status: 'APPROVED',
          approvedAt: { gte: startDate },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
    });

    const skuIds = results.map((r) => r.skuId);
    const skus = await prisma.sku.findMany({
      where: { id: { in: skuIds } },
      include: { catalogItem: { select: { name: true } } },
    });

    const skuMap = new Map(skus.map((s) => [s.id, s]));

    const rankings: ProductRanking[] = results.map((r) => {
      const sku = skuMap.get(r.skuId);
      return {
        skuId: r.skuId,
        skuCode: sku?.code || '',
        productName: sku?.catalogItem.name || '',
        totalExported: r._sum.quantity || 0,
      };
    });

    return {
      top: rankings.slice(0, limit),
      bottom: rankings.slice(-limit).reverse(),
    };
  }

  async getTurnoverRates(days: number): Promise<TurnoverData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get export volumes per SKU
    const exports = await prisma.operationLineItem.groupBy({
      by: ['skuId'],
      where: {
        operation: {
          type: 'EXPORT',
          status: 'APPROVED',
          approvedAt: { gte: startDate },
        },
      },
      _sum: { quantity: true },
    });

    // Get current inventory
    const inventory = await prisma.inventoryRecord.findMany({
      include: { sku: { include: { catalogItem: { select: { name: true } } } } },
    });

    const exportMap = new Map(exports.map((e) => [e.skuId, e._sum.quantity || 0]));

    return inventory.map((inv) => {
      const totalExported = exportMap.get(inv.skuId) || 0;
      const avgInventory = inv.quantity; // Simplified: using current as proxy
      const turnoverRate = avgInventory > 0
        ? Math.round((totalExported / avgInventory) * 100) / 100
        : null;

      return {
        skuId: inv.skuId,
        skuCode: inv.sku.code,
        productName: inv.sku.catalogItem.name,
        turnoverRate,
        totalExported,
        avgInventory,
      };
    });
  }

  async getTrends(days: number): Promise<{ imports: TrendData; exports: TrendData }> {
    // Check minimum data requirement
    const firstOp = await prisma.warehouseOperation.findFirst({
      where: { status: 'APPROVED' },
      orderBy: { approvedAt: 'asc' },
    });

    if (!firstOp || !firstOp.approvedAt) {
      throw new BusinessRuleError('No approved operations found');
    }

    const daysSinceFirst = Math.floor(
      (Date.now() - firstOp.approvedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceFirst < 90) {
      throw new BusinessRuleError(
        `Insufficient data for trend analysis. Need 90 days, have ${daysSinceFirst}. ` +
        `${90 - daysSinceFirst} more days required.`,
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const operations = await prisma.warehouseOperation.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: startDate },
      },
      include: { lineItems: true },
      orderBy: { approvedAt: 'asc' },
    });

    const dailyImports: Record<string, number> = {};
    const dailyExports: Record<string, number> = {};

    for (const op of operations) {
      const dateKey = op.approvedAt!.toISOString().split('T')[0];
      const totalQty = op.lineItems.reduce((sum, li) => sum + li.quantity, 0);

      if (op.type === 'IMPORT') {
        dailyImports[dateKey] = (dailyImports[dateKey] || 0) + totalQty;
      } else {
        dailyExports[dateKey] = (dailyExports[dateKey] || 0) + totalQty;
      }
    }

    const importTrend = this.linearRegression(dailyImports);
    const exportTrend = this.linearRegression(dailyExports);

    log.debug({ days }, 'Trends calculated');
    return { imports: importTrend, exports: exportTrend };
  }

  private linearRegression(dailyData: Record<string, number>): TrendData {
    const dates = Object.keys(dailyData).sort();
    const dataPoints = dates.map((d, i) => ({ date: d, value: dailyData[d], x: i }));

    if (dataPoints.length < 2) {
      return { slope: 0, intercept: 0, dataPoints: [], trendLine: [] };
    }

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((s, p) => s + p.x, 0);
    const sumY = dataPoints.reduce((s, p) => s + p.value, 0);
    const sumXY = dataPoints.reduce((s, p) => s + p.x * p.value, 0);
    const sumX2 = dataPoints.reduce((s, p) => s + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendLine = dataPoints.map((p) => ({
      date: p.date,
      value: Math.round((slope * p.x + intercept) * 100) / 100,
    }));

    return {
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 100) / 100,
      dataPoints: dataPoints.map((p) => ({ date: p.date, value: p.value })),
      trendLine,
    };
  }
}

export const analyticsService = new AnalyticsService();
