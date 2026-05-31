import { Prisma, AuditOperationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import { getSkipTake, buildPaginatedResponse } from '../../shared/utils/pagination.js';
import type { PaginationParams, PaginatedResponse } from '../../shared/utils/pagination.js';

const log = createChildLogger({ module: 'audit-service' });

export interface AuditEntry {
  entityType: string;
  entityId: string;
  operationType: AuditOperationType;
  actorId: string;
  beforeData?: unknown;
  afterData?: unknown;
}

export interface AuditQueryParams extends PaginationParams {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  operationType?: AuditOperationType;
  startDate?: Date;
  endDate?: Date;
}

export class AuditService {
  async log(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || prisma;
    await client.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        operationType: entry.operationType,
        actorId: entry.actorId,
        beforeData: entry.beforeData as Prisma.InputJsonValue ?? undefined,
        afterData: entry.afterData as Prisma.InputJsonValue ?? undefined,
      },
    });
    log.debug({ entityType: entry.entityType, entityId: entry.entityId }, 'Audit logged');
  }

  async query(params: AuditQueryParams): Promise<PaginatedResponse<unknown>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.actorId) where.actorId = params.actorId;
    if (params.operationType) where.operationType = params.operationType;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const { skip, take } = getSkipTake(params);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResponse(logs, total, params);
  }
}

export const auditService = new AuditService();
