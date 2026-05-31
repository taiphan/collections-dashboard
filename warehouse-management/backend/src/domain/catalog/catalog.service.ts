import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { getSkipTake, buildPaginatedResponse } from '../../shared/utils/pagination.js';
import type { PaginationParams, PaginatedResponse } from '../../shared/utils/pagination.js';
import { auditService } from '../audit/audit.service.js';

const log = createChildLogger({ module: 'catalog-service' });

export interface CreateCatalogItemInput {
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  imageUrl?: string;
}

export interface UpdateCatalogItemInput {
  name?: string;
  description?: string;
  category?: string;
  unitOfMeasure?: string;
  imageUrl?: string;
}

export interface CatalogListParams extends PaginationParams {
  search?: string;
  category?: string;
}

export class CatalogService {
  async create(input: CreateCatalogItemInput, actorId: string) {
    const existing = await prisma.catalogItem.findUnique({
      where: { name_category: { name: input.name, category: input.category } },
    });

    if (existing) {
      throw new ConflictError(
        `Catalog item '${input.name}' already exists in category '${input.category}'`,
      );
    }

    const item = await prisma.catalogItem.create({
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        unitOfMeasure: input.unitOfMeasure,
        imageUrl: input.imageUrl,
        createdBy: actorId,
      },
    });

    await auditService.log({
      entityType: 'CatalogItem',
      entityId: item.id,
      operationType: 'CREATE',
      actorId,
      afterData: item,
    });

    log.info({ itemId: item.id, name: input.name }, 'Catalog item created');
    return item;
  }

  async update(id: string, input: UpdateCatalogItemInput, actorId: string) {
    const existing = await prisma.catalogItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('CatalogItem', id);

    // Check unique constraint if name or category changed
    const newName = input.name || existing.name;
    const newCategory = input.category || existing.category;

    if (newName !== existing.name || newCategory !== existing.category) {
      const duplicate = await prisma.catalogItem.findUnique({
        where: { name_category: { name: newName, category: newCategory } },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          `Catalog item '${newName}' already exists in category '${newCategory}'`,
        );
      }
    }

    const updated = await prisma.catalogItem.update({
      where: { id },
      data: { ...input, updatedBy: actorId },
    });

    await auditService.log({
      entityType: 'CatalogItem',
      entityId: id,
      operationType: 'UPDATE',
      actorId,
      beforeData: existing,
      afterData: updated,
    });

    log.info({ itemId: id }, 'Catalog item updated');
    return updated;
  }

  async delete(id: string, actorId: string) {
    const existing = await prisma.catalogItem.findUnique({
      where: { id },
      include: {
        skus: {
          include: { inventory: true },
        },
      },
    });

    if (!existing) throw new NotFoundError('CatalogItem', id);

    const hasInventory = existing.skus.some(
      (sku) => sku.inventory && sku.inventory.quantity > 0,
    );

    if (hasInventory) {
      throw new BusinessRuleError(
        'Cannot delete catalog item while inventory exists with quantity greater than zero',
      );
    }

    await prisma.catalogItem.delete({ where: { id } });

    await auditService.log({
      entityType: 'CatalogItem',
      entityId: id,
      operationType: 'DELETE',
      actorId,
      beforeData: existing,
    });

    log.info({ itemId: id }, 'Catalog item deleted');
  }

  async findById(id: string) {
    const item = await prisma.catalogItem.findUnique({
      where: { id },
      include: { skus: { include: { barcodes: true, inventory: true } } },
    });
    if (!item) throw new NotFoundError('CatalogItem', id);
    return item;
  }

  async findAll(params: CatalogListParams): Promise<PaginatedResponse<unknown>> {
    const where: Prisma.CatalogItemWhereInput = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { category: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = getSkipTake(params);

    const [items, total] = await Promise.all([
      prisma.catalogItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
        include: { _count: { select: { skus: true } } },
      }),
      prisma.catalogItem.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, params);
  }
}

export const catalogService = new CatalogService();
