import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { getSkipTake, buildPaginatedResponse } from '../../shared/utils/pagination.js';
import type { PaginationParams, PaginatedResponse } from '../../shared/utils/pagination.js';

const log = createChildLogger({ module: 'inventory-service' });

export interface InventoryListParams extends PaginationParams {
  category?: string;
  skuCode?: string;
  location?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export class InventoryService {
  async findAll(params: InventoryListParams): Promise<PaginatedResponse<unknown>> {
    const where: Prisma.InventoryRecordWhereInput = {};

    if (params.location) {
      where.location = { contains: params.location, mode: 'insensitive' };
    }

    if (params.skuCode) {
      where.sku = { code: { contains: params.skuCode, mode: 'insensitive' } };
    }

    if (params.category) {
      where.sku = {
        ...where.sku as Prisma.SkuWhereInput,
        catalogItem: { category: params.category },
      };
    }

    if (params.stockStatus === 'out_of_stock') {
      where.quantity = 0;
    } else if (params.stockStatus === 'low_stock') {
      where.AND = [
        { quantity: { gt: 0 } },
        { quantity: { lte: prisma.inventoryRecord.fields.lowStockThreshold as unknown as number } },
      ];
    }

    const { skip, take } = getSkipTake(params);

    const [records, total] = await Promise.all([
      prisma.inventoryRecord.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        include: {
          sku: {
            include: {
              catalogItem: { select: { id: true, name: true, category: true } },
              barcodes: { select: { value: true, format: true } },
            },
          },
        },
      }),
      prisma.inventoryRecord.count({ where }),
    ]);

    // Enrich with stock status
    const enriched = records.map((record) => ({
      ...record,
      stockStatus: this.getStockStatus(record.quantity, record.lowStockThreshold),
    }));

    return buildPaginatedResponse(enriched, total, params);
  }

  async findBySkuId(skuId: string) {
    const record = await prisma.inventoryRecord.findUnique({
      where: { skuId },
      include: {
        sku: {
          include: {
            catalogItem: true,
            barcodes: true,
          },
        },
      },
    });

    if (!record) throw new NotFoundError('InventoryRecord for SKU', skuId);

    return {
      ...record,
      stockStatus: this.getStockStatus(record.quantity, record.lowStockThreshold),
    };
  }

  async updateThreshold(skuId: string, threshold: number) {
    const record = await prisma.inventoryRecord.findUnique({ where: { skuId } });
    if (!record) throw new NotFoundError('InventoryRecord for SKU', skuId);

    const updated = await prisma.inventoryRecord.update({
      where: { skuId },
      data: { lowStockThreshold: threshold },
    });

    log.info({ skuId, threshold }, 'Low stock threshold updated');
    return updated;
  }

  private getStockStatus(
    quantity: number,
    threshold: number,
  ): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= threshold) return 'low_stock';
    return 'in_stock';
  }
}

export const inventoryService = new InventoryService();
