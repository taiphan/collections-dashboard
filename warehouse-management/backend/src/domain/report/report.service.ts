import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet, cacheDeletePattern } from '../../infrastructure/cache/redis.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { type PeriodType, getPeriodRange, isValidDateRange } from '../../shared/utils/date.js';
import { ValidationError } from '../../shared/errors/index.js';

const log = createChildLogger({ module: 'report-service' });
const CACHE_PREFIX = 'wms:report';
const CACHE_TTL = 3600;

export interface ReportParams {
  periodType: PeriodType;
  startDate?: Date;
  endDate?: Date;
}

export interface ReportData {
  period: { type: PeriodType; start: Date; end: Date };
  totalImports: number;
  totalExports: number;
  netInventoryChange: number;
  topProducts: { skuCode: string; productName: string; totalMoved: number }[];
  financialSummary: { totalImportCost: number; totalExportRevenue: number } | null;
  operationCount: number;
}

export class ReportService {
  async generate(params: ReportParams): Promise<ReportData> {
    const range = params.startDate && params.endDate
      ? { start: params.startDate, end: params.endDate }
      : getPeriodRange(params.periodType);

    if (!isValidDateRange(range.start, range.end)) {
      throw new ValidationError('Start date must be before end date');
    }

    // Check cache
    const cacheKey = `${CACHE_PREFIX}:${params.periodType}:${range.start.toISOString()}:${range.end.toISOString()}`;
    const cached = await cacheGet<ReportData>(cacheKey);
    if (cached) return cached;

    // Query approved operations in the period
    const operations = await prisma.warehouseOperation.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: range.start, lte: range.end },
      },
      include: {
        lineItems: {
          include: { sku: { include: { catalogItem: { select: { name: true } } } } },
        },
      },
    });

    let totalImports = 0;
    let totalExports = 0;
    let totalImportCost = 0;
    let totalExportRevenue = 0;
    let hasFinancialData = true;
    const productMovement: Record<string, { skuCode: string; productName: string; total: number }> = {};

    for (const op of operations) {
      for (const li of op.lineItems) {
        const key = li.skuId;
        if (!productMovement[key]) {
          productMovement[key] = {
            skuCode: li.sku.code,
            productName: li.sku.catalogItem.name,
            total: 0,
          };
        }
        productMovement[key].total += li.quantity;

        if (op.type === 'IMPORT') {
          totalImports += li.quantity;
          if (li.unitCost) {
            totalImportCost += Number(li.unitCost) * li.quantity;
          } else {
            hasFinancialData = false;
          }
        } else {
          totalExports += li.quantity;
          if (li.unitPrice) {
            totalExportRevenue += Number(li.unitPrice) * li.quantity;
          } else {
            hasFinancialData = false;
          }
        }
      }
    }

    const topProducts = Object.values(productMovement)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((p) => ({ skuCode: p.skuCode, productName: p.productName, totalMoved: p.total }));

    const report: ReportData = {
      period: { type: params.periodType, start: range.start, end: range.end },
      totalImports,
      totalExports,
      netInventoryChange: totalImports - totalExports,
      topProducts,
      financialSummary: hasFinancialData
        ? { totalImportCost: Math.round(totalImportCost * 100) / 100, totalExportRevenue: Math.round(totalExportRevenue * 100) / 100 }
        : null,
      operationCount: operations.length,
    };

    await cacheSet(cacheKey, report, CACHE_TTL);
    log.info({ periodType: params.periodType }, 'Report generated');
    return report;
  }

  async invalidateCache(): Promise<void> {
    await cacheDeletePattern(`${CACHE_PREFIX}:*`);
    log.debug('Report cache invalidated');
  }

  exportCsv(report: ReportData): string {
    const lines: string[] = [];
    lines.push('Warehouse Report');
    lines.push(`Period,${report.period.type}`);
    lines.push(`Start,${report.period.start.toISOString()}`);
    lines.push(`End,${report.period.end.toISOString()}`);
    lines.push('');
    lines.push('Summary');
    lines.push(`Total Imports,${report.totalImports}`);
    lines.push(`Total Exports,${report.totalExports}`);
    lines.push(`Net Inventory Change,${report.netInventoryChange}`);
    lines.push(`Operations Count,${report.operationCount}`);

    if (report.financialSummary) {
      lines.push('');
      lines.push('Financial Summary');
      lines.push(`Total Import Cost,${report.financialSummary.totalImportCost}`);
      lines.push(`Total Export Revenue,${report.financialSummary.totalExportRevenue}`);
    }

    lines.push('');
    lines.push('Top Products by Movement');
    lines.push('SKU Code,Product Name,Total Moved');
    for (const p of report.topProducts) {
      lines.push(`${p.skuCode},${p.productName},${p.totalMoved}`);
    }

    return lines.join('\n');
  }
}

export const reportService = new ReportService();
