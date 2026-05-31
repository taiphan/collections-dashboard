import { CaseStage, CaseStatus, CasePriority, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.js';
import { enqueueCaseProcessing } from '../../infrastructure/queue/queue.js';
import { cacheDelete } from '../../infrastructure/cache/redis.js';
import { generateEntityNumber } from '../../shared/utils/id-generator.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'case-service' });

// Stage transition rules — defines valid transitions
const STAGE_TRANSITIONS: Record<CaseStage, CaseStage[]> = {
  INTAKE: ['VERIFICATION'],
  VERIFICATION: ['UNDERWRITING', 'INTAKE'],
  UNDERWRITING: ['APPROVAL', 'VERIFICATION'],
  APPROVAL: ['DOCUMENTATION', 'UNDERWRITING'],
  DOCUMENTATION: ['DISBURSEMENT', 'APPROVAL'],
  DISBURSEMENT: ['CLOSED'],
  CLOSED: [],
};

export interface CreateCaseInput {
  applicationId: string;
  assignedTo?: string;
  priority?: CasePriority;
}

export interface CaseListFilters {
  stage?: CaseStage;
  status?: CaseStatus;
  assignedTo?: string;
  priority?: CasePriority;
  slaBreached?: boolean;
  page?: number;
  limit?: number;
}

export interface StageTransitionInput {
  caseId: string;
  toStage: CaseStage;
  changedBy: string;
  reason?: string;
}

export class CaseService {
  async createCase(input: CreateCaseInput): Promise<string> {
    const caseNumber = generateEntityNumber('case');

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        applicationId: input.applicationId,
        assignedTo: input.assignedTo,
        priority: input.priority || 'NORMAL',
        currentStage: 'INTAKE',
        status: 'OPEN',
      },
    });

    // Create initial tasks for INTAKE stage
    await this.createStageTasks(newCase.id, 'INTAKE');

    // Log activity
    await prisma.caseActivity.create({
      data: {
        caseId: newCase.id,
        activityType: 'STAGE_CHANGE',
        description: `Case ${caseNumber} created and assigned to INTAKE stage`,
        userId: input.assignedTo,
      },
    });

    // Enqueue SLA monitoring
    await enqueueCaseProcessing({
      type: 'SLA_CHECK',
      caseId: newCase.id,
      payload: { stage: 'INTAKE' },
    });

    log.info({ caseId: newCase.id, caseNumber }, 'Case created');
    return newCase.id;
  }

  async getCaseById(caseId: string) {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        application: {
          include: {
            customer: true,
            product: true,
          },
        },
        assignedOfficer: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        tasks: { orderBy: { sortOrder: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        decisions: { orderBy: { createdAt: 'desc' } },
        stageHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!caseData) {
      throw new NotFoundError('Case', caseId);
    }

    return caseData;
  }

  async listCases(filters: CaseListFilters) {
    const { page = 1, limit = 20, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.CaseWhereInput = {};
    if (where.stage) whereClause.currentStage = where.stage;
    if (where.status) whereClause.status = where.status;
    if (where.assignedTo) whereClause.assignedTo = where.assignedTo;
    if (where.priority) whereClause.priority = where.priority;
    if (where.slaBreached !== undefined) whereClause.slaBreached = where.slaBreached;

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where: whereClause,
        include: {
          application: {
            include: {
              customer: { select: { firstName: true, lastName: true } },
              product: { select: { name: true, productType: true } },
            },
          },
          assignedOfficer: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { slaDeadline: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.case.count({ where: whereClause }),
    ]);

    return {
      data: cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async transitionStage(input: StageTransitionInput) {
    const caseData = await prisma.case.findUnique({
      where: { id: input.caseId },
    });

    if (!caseData) {
      throw new NotFoundError('Case', input.caseId);
    }

    // Validate transition
    const allowedTransitions = STAGE_TRANSITIONS[caseData.currentStage];
    if (!allowedTransitions.includes(input.toStage)) {
      throw new BusinessRuleError(
        `Invalid stage transition from ${caseData.currentStage} to ${input.toStage}`,
        { allowedTransitions },
      );
    }

    // Check all tasks in current stage are completed
    const pendingTasks = await prisma.caseTask.count({
      where: {
        caseId: input.caseId,
        stage: caseData.currentStage,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (pendingTasks > 0) {
      throw new BusinessRuleError(
        `Cannot transition: ${pendingTasks} task(s) still pending in ${caseData.currentStage}`,
      );
    }

    // Calculate duration in previous stage
    const lastTransition = await prisma.stageHistory.findFirst({
      where: { caseId: input.caseId },
      orderBy: { createdAt: 'desc' },
    });
    const stageStartTime = lastTransition?.createdAt || caseData.startedAt;
    const durationMinutes = Math.round(
      (Date.now() - stageStartTime.getTime()) / 60000,
    );

    // Perform transition
    const [updatedCase] = await prisma.$transaction([
      prisma.case.update({
        where: { id: input.caseId },
        data: {
          currentStage: input.toStage,
          status: input.toStage === 'CLOSED' ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: input.toStage === 'CLOSED' ? new Date() : undefined,
        },
      }),
      prisma.stageHistory.create({
        data: {
          caseId: input.caseId,
          fromStage: caseData.currentStage,
          toStage: input.toStage,
          changedBy: input.changedBy,
          reason: input.reason,
          duration: durationMinutes,
        },
      }),
      prisma.caseActivity.create({
        data: {
          caseId: input.caseId,
          userId: input.changedBy,
          activityType: 'STAGE_CHANGE',
          description: `Stage transitioned from ${caseData.currentStage} to ${input.toStage}`,
          metadata: { reason: input.reason },
        },
      }),
    ]);

    // Create tasks for new stage
    if (input.toStage !== 'CLOSED') {
      await this.createStageTasks(input.caseId, input.toStage);
    }

    // Invalidate cache
    await cacheDelete(`los:case:${input.caseId}`);

    log.info(
      { caseId: input.caseId, from: caseData.currentStage, to: input.toStage },
      'Stage transition completed',
    );

    return updatedCase;
  }

  async assignCase(caseId: string, userId: string, assignedBy: string) {
    const caseData = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) throw new NotFoundError('Case', caseId);

    const updated = await prisma.case.update({
      where: { id: caseId },
      data: { assignedTo: userId },
    });

    await prisma.caseActivity.create({
      data: {
        caseId,
        userId: assignedBy,
        activityType: 'ASSIGNMENT',
        description: `Case assigned to user ${userId}`,
      },
    });

    await cacheDelete(`los:case:${caseId}`);
    return updated;
  }

  async updatePriority(caseId: string, priority: CasePriority, userId: string) {
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: { priority },
    });

    await prisma.caseActivity.create({
      data: {
        caseId,
        userId,
        activityType: 'STATUS_CHANGE',
        description: `Priority changed to ${priority}`,
      },
    });

    return updated;
  }

  async getDashboardStats(userId?: string) {
    const baseWhere: Prisma.CaseWhereInput = userId
      ? { assignedTo: userId }
      : {};

    const [byStage, byStatus, slaBreached, totalActive] = await Promise.all([
      prisma.case.groupBy({
        by: ['currentStage'],
        where: { ...baseWhere, status: { not: 'COMPLETED' } },
        _count: true,
      }),
      prisma.case.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true,
      }),
      prisma.case.count({
        where: { ...baseWhere, slaBreached: true, status: { not: 'COMPLETED' } },
      }),
      prisma.case.count({
        where: { ...baseWhere, status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } },
      }),
    ]);

    return { byStage, byStatus, slaBreached, totalActive };
  }

  private async createStageTasks(caseId: string, stage: CaseStage) {
    const taskTemplates = STAGE_TASK_TEMPLATES[stage] || [];

    await prisma.caseTask.createMany({
      data: taskTemplates.map((template, index) => ({
        caseId,
        stage,
        title: template.title,
        description: template.description,
        taskType: template.taskType,
        sortOrder: index,
      })),
    });
  }
}

// Default task templates per stage
const STAGE_TASK_TEMPLATES: Record<CaseStage, Array<{
  title: string;
  description: string;
  taskType: 'MANUAL' | 'AUTOMATED' | 'APPROVAL' | 'DOCUMENT_REVIEW' | 'VERIFICATION';
}>> = {
  INTAKE: [
    { title: 'Validate application data', description: 'Check completeness of application form', taskType: 'AUTOMATED' },
    { title: 'Verify applicant identity', description: 'KYC verification check', taskType: 'VERIFICATION' },
    { title: 'Check document completeness', description: 'Ensure all required documents are uploaded', taskType: 'DOCUMENT_REVIEW' },
  ],
  VERIFICATION: [
    { title: 'Income verification', description: 'Verify income documents and employment', taskType: 'VERIFICATION' },
    { title: 'Address verification', description: 'Verify residential address', taskType: 'VERIFICATION' },
    { title: 'Reference check', description: 'Contact references if applicable', taskType: 'MANUAL' },
  ],
  UNDERWRITING: [
    { title: 'Credit bureau pull', description: 'Fetch credit report from bureau', taskType: 'AUTOMATED' },
    { title: 'Risk assessment', description: 'Calculate risk score and grade', taskType: 'AUTOMATED' },
    { title: 'DTI calculation', description: 'Calculate debt-to-income ratio', taskType: 'AUTOMATED' },
    { title: 'Underwriter review', description: 'Manual review by underwriter', taskType: 'MANUAL' },
  ],
  APPROVAL: [
    { title: 'Final decision', description: 'Approve or reject the application', taskType: 'APPROVAL' },
    { title: 'Terms finalization', description: 'Finalize loan terms and conditions', taskType: 'MANUAL' },
  ],
  DOCUMENTATION: [
    { title: 'Generate loan agreement', description: 'Create loan agreement document', taskType: 'AUTOMATED' },
    { title: 'Collect signatures', description: 'Obtain borrower signatures', taskType: 'MANUAL' },
    { title: 'Compliance review', description: 'Final compliance check', taskType: 'MANUAL' },
  ],
  DISBURSEMENT: [
    { title: 'Account setup', description: 'Create loan account in core banking', taskType: 'AUTOMATED' },
    { title: 'Fund transfer', description: 'Initiate disbursement', taskType: 'AUTOMATED' },
    { title: 'Confirmation', description: 'Confirm disbursement to borrower', taskType: 'AUTOMATED' },
  ],
  CLOSED: [],
};

export const caseService = new CaseService();
