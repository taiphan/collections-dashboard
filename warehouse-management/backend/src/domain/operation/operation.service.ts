import { Prisma, OperationType, OperationStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError, BusinessRuleError, ValidationError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { getSkipTake, buildPaginatedResponse } from '../../shared/utils/pagination.js';
import type { PaginationParams, PaginatedResponse } from '../../shared/utils/pagination.js';
import { auditService } from '../audit/audit.service.js';
import { workflowService } from './workflow.service.js';

const log = createChildLogger({ module: 'operation-service' });

export interface LineItemInput {
  skuId: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
}

export interface CreateImportInput {
  supplierRef?: string;
  expectedDate?: Date;
  lineItems: LineItemInput[];
}

export interface CreateExportInput {
  destination: string;
  reason: 'SALE' | 'TRANSFER' | 'RETURN';
  lineItems: LineItemInput[];
}

export interface OperationListParams extends PaginationParams {
  type?: OperationType;
  status?: OperationStatus;
}

export class OperationService {
  async createImport(input: CreateImportInput, actorId: string) {
    if (input.lineItems.length === 0 || input.lineItems.length > 500) {
      throw new ValidationError('Import operation must have between 1 and 500 line items');
    }

    await this.validateSkuIds(input.lineItems.map((li) => li.skuId));

    const operationNumber = await this.generateOperationNumber('IMPORT');

    const operation = await prisma.warehouseOperation.create({
      data: {
        operationNumber,
        type: 'IMPORT',
        status: 'DRAFT',
        createdById: actorId,
        supplierRef: input.supplierRef,
        expectedDate: input.expectedDate,
        lineItems: {
          create: input.lineItems.map((li) => ({
            skuId: li.skuId,
            quantity: li.quantity,
            unitCost: li.unitCost,
          })),
        },
      },
      include: { lineItems: { include: { sku: true } } },
    });

    await this.logStatusTransition(operation.id, 'DRAFT', 'DRAFT', actorId);

    await auditService.log({
      entityType: 'WarehouseOperation',
      entityId: operation.id,
      operationType: 'CREATE',
      actorId,
      afterData: operation,
    });

    log.info({ operationId: operation.id, number: operationNumber }, 'Import operation created');
    return operation;
  }

  async createExport(input: CreateExportInput, actorId: string) {
    if (input.lineItems.length === 0 || input.lineItems.length > 200) {
      throw new ValidationError('Export operation must have between 1 and 200 line items');
    }

    await this.validateSkuIds(input.lineItems.map((li) => li.skuId));

    const operationNumber = await this.generateOperationNumber('EXPORT');

    const operation = await prisma.warehouseOperation.create({
      data: {
        operationNumber,
        type: 'EXPORT',
        status: 'DRAFT',
        createdById: actorId,
        destination: input.destination,
        reason: input.reason,
        lineItems: {
          create: input.lineItems.map((li) => ({
            skuId: li.skuId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        },
      },
      include: { lineItems: { include: { sku: true } } },
    });

    await this.logStatusTransition(operation.id, 'DRAFT', 'DRAFT', actorId);

    await auditService.log({
      entityType: 'WarehouseOperation',
      entityId: operation.id,
      operationType: 'CREATE',
      actorId,
      afterData: operation,
    });

    log.info({ operationId: operation.id, number: operationNumber }, 'Export operation created');
    return operation;
  }

  async submit(operationId: string, actorId: string) {
    const operation = await this.findByIdOrThrow(operationId);
    workflowService.validateTransition(operation.status, 'PENDING_REVIEW');

    const updated = await prisma.warehouseOperation.update({
      where: { id: operationId },
      data: { status: 'PENDING_REVIEW' },
      include: { lineItems: { include: { sku: true } } },
    });

    await this.logStatusTransition(operationId, operation.status, 'PENDING_REVIEW', actorId);
    log.info({ operationId }, 'Operation submitted for review');
    return updated;
  }

  async approve(operationId: string, actorId: string) {
    const operation = await this.findByIdOrThrow(operationId);
    workflowService.validateTransition(operation.status, 'APPROVED');
    workflowService.validateApproval(operation.createdById, actorId);

    // Atomic inventory update + status change
    const updated = await prisma.$transaction(async (tx) => {
      const op = await tx.warehouseOperation.findUnique({
        where: { id: operationId },
        include: { lineItems: true },
      });

      if (!op) throw new NotFoundError('WarehouseOperation', operationId);

      // Apply inventory changes
      for (const lineItem of op.lineItems) {
        if (op.type === 'IMPORT') {
          await tx.inventoryRecord.update({
            where: { skuId: lineItem.skuId },
            data: { quantity: { increment: lineItem.quantity } },
          });
        } else {
          // Check stock before decrement
          const inventory = await tx.inventoryRecord.findUnique({
            where: { skuId: lineItem.skuId },
          });

          if (!inventory || inventory.quantity < lineItem.quantity) {
            const sku = await tx.sku.findUnique({ where: { id: lineItem.skuId } });
            throw new BusinessRuleError(
              `Insufficient stock for SKU '${sku?.code}': available ${inventory?.quantity ?? 0}, requested ${lineItem.quantity}`,
            );
          }

          await tx.inventoryRecord.update({
            where: { skuId: lineItem.skuId },
            data: { quantity: { decrement: lineItem.quantity } },
          });
        }
      }

      const result = await tx.warehouseOperation.update({
        where: { id: operationId },
        data: {
          status: 'APPROVED',
          approvedById: actorId,
          approvedAt: new Date(),
        },
        include: { lineItems: { include: { sku: true } } },
      });

      await auditService.log({
        entityType: 'WarehouseOperation',
        entityId: operationId,
        operationType: 'UPDATE',
        actorId,
        beforeData: { status: operation.status },
        afterData: { status: 'APPROVED' },
      }, tx);

      return result;
    });

    await this.logStatusTransition(operationId, operation.status, 'APPROVED', actorId);
    log.info({ operationId }, 'Operation approved');
    return updated;
  }

  async reject(operationId: string, actorId: string, reason: string) {
    const operation = await this.findByIdOrThrow(operationId);
    workflowService.validateTransition(operation.status, 'REJECTED');
    workflowService.validateRejectionReason(reason);

    const updated = await prisma.warehouseOperation.update({
      where: { id: operationId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
      include: { lineItems: { include: { sku: true } } },
    });

    await this.logStatusTransition(operationId, operation.status, 'REJECTED', actorId, reason);

    await auditService.log({
      entityType: 'WarehouseOperation',
      entityId: operationId,
      operationType: 'UPDATE',
      actorId,
      beforeData: { status: operation.status },
      afterData: { status: 'REJECTED', rejectionReason: reason },
    });

    log.info({ operationId }, 'Operation rejected');
    return updated;
  }

  async cancel(operationId: string, actorId: string) {
    const operation = await this.findByIdOrThrow(operationId);
    workflowService.validateTransition(operation.status, 'CANCELLED');

    const updated = await prisma.warehouseOperation.update({
      where: { id: operationId },
      data: { status: 'CANCELLED' },
      include: { lineItems: { include: { sku: true } } },
    });

    await this.logStatusTransition(operationId, operation.status, 'CANCELLED', actorId);
    log.info({ operationId }, 'Operation cancelled');
    return updated;
  }

  async findById(operationId: string) {
    return this.findByIdOrThrow(operationId);
  }

  async findAll(params: OperationListParams): Promise<PaginatedResponse<unknown>> {
    const where: Prisma.WarehouseOperationWhereInput = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;

    const { skip, take } = getSkipTake(params);

    const [operations, total] = await Promise.all([
      prisma.warehouseOperation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { lineItems: true } },
        },
      }),
      prisma.warehouseOperation.count({ where }),
    ]);

    return buildPaginatedResponse(operations, total, params);
  }

  async getStatusLog(operationId: string) {
    return prisma.operationStatusLog.findMany({
      where: { operationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findByIdOrThrow(id: string) {
    const operation = await prisma.warehouseOperation.findUnique({
      where: { id },
      include: {
        lineItems: { include: { sku: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        statusLog: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!operation) throw new NotFoundError('WarehouseOperation', id);
    return operation;
  }

  private async validateSkuIds(skuIds: string[]) {
    const skus = await prisma.sku.findMany({
      where: { id: { in: skuIds } },
      select: { id: true },
    });

    const foundIds = new Set(skus.map((s) => s.id));
    const invalid = skuIds.filter((id) => !foundIds.has(id));

    if (invalid.length > 0) {
      throw new ValidationError(
        `Invalid SKU identifiers: ${invalid.join(', ')}`,
      );
    }
  }

  private async generateOperationNumber(type: OperationType): Promise<string> {
    const prefix = type === 'IMPORT' ? 'IMP' : 'EXP';
    const year = new Date().getFullYear();

    const lastOp = await prisma.warehouseOperation.findFirst({
      where: {
        operationNumber: { startsWith: `${prefix}-${year}` },
      },
      orderBy: { operationNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOp) {
      const parts = lastOp.operationNumber.split('-');
      sequence = parseInt(parts[2]) + 1;
    }

    return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
  }

  private async logStatusTransition(
    operationId: string,
    fromStatus: OperationStatus,
    toStatus: OperationStatus,
    changedBy: string,
    reason?: string,
  ) {
    await prisma.operationStatusLog.create({
      data: { operationId, fromStatus, toStatus, changedBy, reason },
    });
  }
}

export const operationService = new OperationService();
