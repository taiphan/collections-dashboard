import { prisma } from '../../infrastructure/database/prisma.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { BusinessRuleError, NotFoundError } from '../../shared/errors/index.js';

const log = createChildLogger({ module: 'prediction-service' });
const MIN_HISTORY_DAYS = 180;
const FORECAST_DAYS = 30;

export interface ForecastData {
  skuId: string;
  skuCode: string;
  productName: string;
  dailyForecasts: { date: string; predicted: number; low: number; high: number }[];
  methodology: string;
  dataRange: { start: string; end: string };
  generatedAt: string;
}

export interface ReorderAlert {
  skuId: string;
  skuCode: string;
  productName: string;
  currentStock: number;
  pendingImports: number;
  forecastedDemand: number;
  recommendedReorder: number;
  leadTimeDays: number;
}

export class PredictionService {
  async getForecast(skuId: string): Promise<ForecastData> {
    const sku = await prisma.sku.findUnique({
      where: { id: skuId },
      include: { catalogItem: { select: { name: true } } },
    });

    if (!sku) throw new NotFoundError('Sku', skuId);

    // Check for existing predictions
    const predictions = await prisma.prediction.findMany({
      where: {
        skuId,
        forecastDate: { gte: new Date() },
      },
      orderBy: { forecastDate: 'asc' },
    });

    if (predictions.length > 0) {
      return {
        skuId,
        skuCode: sku.code,
        productName: sku.catalogItem.name,
        dailyForecasts: predictions.map((p) => ({
          date: p.forecastDate.toISOString().split('T')[0],
          predicted: p.predictedQty,
          low: p.lowEstimate,
          high: p.highEstimate,
        })),
        methodology: predictions[0].methodology,
        dataRange: {
          start: predictions[0].dataStartDate.toISOString().split('T')[0],
          end: predictions[0].dataEndDate.toISOString().split('T')[0],
        },
        generatedAt: predictions[0].generatedAt.toISOString(),
      };
    }

    // Generate fresh forecast
    return this.generateForecast(skuId);
  }

  async generateForecast(skuId: string): Promise<ForecastData> {
    const sku = await prisma.sku.findUnique({
      where: { id: skuId },
      include: { catalogItem: { select: { name: true } } },
    });

    if (!sku) throw new NotFoundError('Sku', skuId);

    // Get historical export data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    const exports = await prisma.operationLineItem.findMany({
      where: {
        skuId,
        operation: {
          type: 'EXPORT',
          status: 'APPROVED',
          approvedAt: { gte: startDate },
        },
      },
      include: { operation: { select: { approvedAt: true } } },
      orderBy: { operation: { approvedAt: 'asc' } },
    });

    if (exports.length === 0) {
      throw new BusinessRuleError(
        `No export history found for SKU '${sku.code}'. Need at least ${MIN_HISTORY_DAYS} days of data.`,
      );
    }

    const firstExport = exports[0].operation.approvedAt!;
    const daysSinceFirst = Math.floor(
      (Date.now() - firstExport.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceFirst < MIN_HISTORY_DAYS) {
      throw new BusinessRuleError(
        `Insufficient history for SKU '${sku.code}'. Need ${MIN_HISTORY_DAYS} days, have ${daysSinceFirst}.`,
      );
    }

    // Aggregate daily exports
    const dailyExports: Record<string, number> = {};
    for (const exp of exports) {
      const dateKey = exp.operation.approvedAt!.toISOString().split('T')[0];
      dailyExports[dateKey] = (dailyExports[dateKey] || 0) + exp.quantity;
    }

    // Simple exponential smoothing forecast
    const dates = Object.keys(dailyExports).sort();
    const values = dates.map((d) => dailyExports[d]);

    const alpha = 0.3; // Smoothing factor
    let smoothed = values[0];
    const errors: number[] = [];

    for (let i = 1; i < values.length; i++) {
      const error = values[i] - smoothed;
      errors.push(Math.abs(error));
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }

    const avgError = errors.length > 0
      ? errors.reduce((s, e) => s + e, 0) / errors.length
      : smoothed * 0.3;

    // Generate forecasts
    const now = new Date();
    const dailyForecasts: { date: string; predicted: number; low: number; high: number }[] = [];
    const predictionRecords = [];

    for (let i = 1; i <= FORECAST_DAYS; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      const predicted = Math.max(0, Math.round(smoothed));
      const low = Math.max(0, Math.round(smoothed - 1.28 * avgError)); // 10th percentile
      const high = Math.round(smoothed + 1.28 * avgError); // 90th percentile

      dailyForecasts.push({ date: dateStr, predicted, low, high });
      predictionRecords.push({
        skuId,
        forecastDate,
        predictedQty: predicted,
        lowEstimate: low,
        highEstimate: high,
        methodology: 'Exponential Smoothing (alpha=0.3)',
        dataStartDate: firstExport,
        dataEndDate: now,
        generatedAt: now,
      });
    }

    // Store predictions
    await prisma.prediction.deleteMany({ where: { skuId } });
    await prisma.prediction.createMany({ data: predictionRecords });

    log.info({ skuId, skuCode: sku.code }, 'Forecast generated');

    return {
      skuId,
      skuCode: sku.code,
      productName: sku.catalogItem.name,
      dailyForecasts,
      methodology: 'Exponential Smoothing (alpha=0.3)',
      dataRange: {
        start: firstExport.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
      generatedAt: now.toISOString(),
    };
  }

  async getReorderAlerts(leadTimeDays: number = 14): Promise<ReorderAlert[]> {
    const alerts: ReorderAlert[] = [];

    // Get all SKUs with predictions
    const skusWithPredictions = await prisma.prediction.findMany({
      where: { forecastDate: { gte: new Date() } },
      select: { skuId: true },
      distinct: ['skuId'],
    });

    for (const { skuId } of skusWithPredictions) {
      const leadTimeEnd = new Date();
      leadTimeEnd.setDate(leadTimeEnd.getDate() + leadTimeDays);

      // Get forecasted demand within lead time
      const predictions = await prisma.prediction.findMany({
        where: {
          skuId,
          forecastDate: { gte: new Date(), lte: leadTimeEnd },
        },
      });

      const forecastedDemand = predictions.reduce((sum, p) => sum + p.predictedQty, 0);

      // Get current stock
      const inventory = await prisma.inventoryRecord.findUnique({
        where: { skuId },
        include: { sku: { include: { catalogItem: { select: { name: true } } } } },
      });

      if (!inventory) continue;

      // Get pending imports
      const pendingImports = await prisma.operationLineItem.aggregate({
        where: {
          skuId,
          operation: {
            type: 'IMPORT',
            status: { in: ['DRAFT', 'PENDING_REVIEW'] },
          },
        },
        _sum: { quantity: true },
      });

      const pendingQty = pendingImports._sum.quantity || 0;
      const availableStock = inventory.quantity + pendingQty;

      if (forecastedDemand > availableStock) {
        alerts.push({
          skuId,
          skuCode: inventory.sku.code,
          productName: inventory.sku.catalogItem.name,
          currentStock: inventory.quantity,
          pendingImports: pendingQty,
          forecastedDemand,
          recommendedReorder: forecastedDemand - availableStock,
          leadTimeDays,
        });
      }
    }

    return alerts.sort((a, b) => b.recommendedReorder - a.recommendedReorder);
  }
}

export const predictionService = new PredictionService();
