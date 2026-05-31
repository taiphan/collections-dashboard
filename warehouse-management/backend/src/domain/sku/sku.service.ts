import { prisma } from '../../infrastructure/database/prisma.js';
import { cacheGet, cacheSet, cacheDelete } from '../../infrastructure/cache/redis.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { auditService } from '../audit/audit.service.js';
import { validateBarcode } from './barcode.validator.js';

const log = createChildLogger({ module: 'sku-service' });
const BARCODE_CACHE_PREFIX = 'wms:barcode';
const BARCODE_CACHE_TTL = 3600;

export interface CreateSkuInput {
  code: string;
  size?: string;
  color?: string;
  weight?: number;
}

export interface AddBarcodeInput {
  value: string;
}

export class SkuService {
  async create(catalogItemId: string, input: CreateSkuInput, actorId: string) {
    // Verify catalog item exists
    const catalogItem = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
      include: { _count: { select: { skus: true } } },
    });

    if (!catalogItem) throw new NotFoundError('CatalogItem', catalogItemId);

    if (catalogItem._count.skus >= 100) {
      throw new BusinessRuleError('Maximum 100 SKUs per catalog item');
    }

    // Check unique code
    const existingCode = await prisma.sku.findUnique({ where: { code: input.code } });
    if (existingCode) {
      throw new ConflictError(`SKU code '${input.code}' already exists`);
    }

    // Create SKU and initialize inventory in a transaction
    const sku = await prisma.$transaction(async (tx) => {
      const newSku = await tx.sku.create({
        data: {
          catalogItemId,
          code: input.code,
          size: input.size,
          color: input.color,
          weight: input.weight,
        },
      });

      // Initialize inventory record with quantity 0
      await tx.inventoryRecord.create({
        data: {
          skuId: newSku.id,
          quantity: 0,
        },
      });

      return newSku;
    });

    await auditService.log({
      entityType: 'Sku',
      entityId: sku.id,
      operationType: 'CREATE',
      actorId,
      afterData: sku,
    });

    log.info({ skuId: sku.id, code: input.code }, 'SKU created');
    return sku;
  }

  async addBarcode(skuId: string, input: AddBarcodeInput, actorId: string) {
    const sku = await prisma.sku.findUnique({
      where: { id: skuId },
      include: { _count: { select: { barcodes: true } } },
    });

    if (!sku) throw new NotFoundError('Sku', skuId);

    if (sku._count.barcodes >= 10) {
      throw new BusinessRuleError('Maximum 10 barcodes per SKU');
    }

    // Validate barcode format
    const validation = validateBarcode(input.value);
    if (!validation.valid) {
      throw new BusinessRuleError(validation.error!);
    }

    // Check uniqueness
    const existingBarcode = await prisma.barcode.findUnique({
      where: { value: input.value },
    });
    if (existingBarcode) {
      throw new ConflictError(
        `Barcode '${input.value}' already exists and is associated with another SKU`,
      );
    }

    const barcode = await prisma.barcode.create({
      data: {
        skuId,
        value: input.value,
        format: validation.format!,
      },
    });

    await auditService.log({
      entityType: 'Barcode',
      entityId: barcode.id,
      operationType: 'CREATE',
      actorId,
      afterData: barcode,
    });

    log.info({ barcodeId: barcode.id, skuId }, 'Barcode added');
    return barcode;
  }

  async removeBarcode(skuId: string, barcodeId: string, actorId: string) {
    const barcode = await prisma.barcode.findFirst({
      where: { id: barcodeId, skuId },
    });

    if (!barcode) throw new NotFoundError('Barcode', barcodeId);

    await prisma.barcode.delete({ where: { id: barcodeId } });
    await cacheDelete(`${BARCODE_CACHE_PREFIX}:${barcode.value}`);

    await auditService.log({
      entityType: 'Barcode',
      entityId: barcodeId,
      operationType: 'DELETE',
      actorId,
      beforeData: barcode,
    });

    log.info({ barcodeId, skuId }, 'Barcode removed');
  }

  async lookupByBarcode(value: string) {
    // Check cache first
    const cached = await cacheGet<unknown>(`${BARCODE_CACHE_PREFIX}:${value}`);
    if (cached) return cached;

    const barcode = await prisma.barcode.findUnique({
      where: { value },
      include: {
        sku: {
          include: {
            catalogItem: { select: { id: true, name: true, category: true } },
            inventory: true,
          },
        },
      },
    });

    if (!barcode) throw new NotFoundError('Barcode', value);

    const result = {
      barcode: { id: barcode.id, value: barcode.value, format: barcode.format },
      sku: {
        id: barcode.sku.id,
        code: barcode.sku.code,
        size: barcode.sku.size,
        color: barcode.sku.color,
        weight: barcode.sku.weight,
      },
      catalogItem: barcode.sku.catalogItem,
      inventory: barcode.sku.inventory,
    };

    await cacheSet(`${BARCODE_CACHE_PREFIX}:${value}`, result, BARCODE_CACHE_TTL);
    return result;
  }

  async findById(id: string) {
    const sku = await prisma.sku.findUnique({
      where: { id },
      include: { barcodes: true, inventory: true, catalogItem: true },
    });
    if (!sku) throw new NotFoundError('Sku', id);
    return sku;
  }

  async findByCatalogItem(catalogItemId: string) {
    return prisma.sku.findMany({
      where: { catalogItemId },
      include: { barcodes: true, inventory: true },
      orderBy: { code: 'asc' },
    });
  }
}

export const skuService = new SkuService();
