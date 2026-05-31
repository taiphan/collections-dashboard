import { prisma } from '../../infrastructure/database/prisma.js';
import { integrationService } from '../integration/integration.service.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'disbursement-service' });

// ============================================================
// Types
// ============================================================

export type DisbursementStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface InitiateDisbursementInput {
  caseId: string;
  amount: number;
  currency: string;
  accountNumber: string;
  initiatedBy: string;
}

export interface DisbursementRecord {
  id: string;
  caseId: string;
  applicationId: string;
  customerId: string;
  amount: number;
  currency: string;
  accountNumber: string;
  status: DisbursementStatus;
  transactionId: string | null;
  reference: string;
  initiatedBy: string;
  initiatedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface DisbursementStatusResult {
  id: string;
  status: DisbursementStatus;
  transactionId: string | null;
  reference: string;
  amount: number;
  currency: string;
  initiatedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

// ============================================================
// Disbursement Service
// ============================================================

export class DisbursementService {
  /**
   * Validate that a case is ready for disbursement:
   * - Must be in DOCUMENTATION stage (about to move to DISBURSEMENT)
   *   OR already in DISBURSEMENT stage
   * - All tasks in current stage must be complete
   */
  async validateReadyForDisbursement(caseId: string): Promise<void> {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        tasks: true,
        application: { select: { id: true, customerId: true } },
      },
    });

    if (!caseData) {
      throw new NotFoundError('Case', caseId);
    }

    const validStages = ['DOCUMENTATION', 'DISBURSEMENT'];
    if (!validStages.includes(caseData.currentStage)) {
      throw new BusinessRuleError(
        `Case must be in DOCUMENTATION or DISBURSEMENT stage for disbursement. Current stage: ${caseData.currentStage}`,
      );
    }

    // Check all tasks in DOCUMENTATION stage are completed
    const pendingDocTasks = caseData.tasks.filter(
      (t) => t.stage === 'DOCUMENTATION' && t.status !== 'COMPLETED',
    );

    if (pendingDocTasks.length > 0) {
      throw new BusinessRuleError(
        `Cannot disburse: ${pendingDocTasks.length} documentation task(s) still pending`,
        { pendingTasks: pendingDocTasks.map((t) => t.title) },
      );
    }
  }

  /**
   * Initiate disbursement — calls integration service
   */
  async initiateDisbursement(input: InitiateDisbursementInput): Promise<DisbursementRecord> {
    // Validate case readiness
    await this.validateReadyForDisbursement(input.caseId);

    const caseData = await prisma.case.findUnique({
      where: { id: input.caseId },
      include: {
        application: { select: { id: true, customerId: true } },
      },
    });

    if (!caseData || !caseData.application) {
      throw new NotFoundError('Case', input.caseId);
    }

    const reference = `DISB-${Date.now().toString(36).toUpperCase()}-${input.caseId.slice(0, 8)}`;

    // Create disbursement record with PENDING status
    const disbursement = await prisma.caseActivity.create({
      data: {
        caseId: input.caseId,
        userId: input.initiatedBy,
        activityType: 'DISBURSEMENT',
        description: `Disbursement initiated: ${input.currency} ${input.amount}`,
        metadata: {
          type: 'DISBURSEMENT_RECORD',
          applicationId: caseData.application.id,
          customerId: caseData.application.customerId,
          amount: input.amount,
          currency: input.currency,
          accountNumber: input.accountNumber,
          status: 'PENDING' as DisbursementStatus,
          transactionId: null,
          reference,
          initiatedBy: input.initiatedBy,
          initiatedAt: new Date().toISOString(),
          completedAt: null,
          failureReason: null,
        } as any,
      },
    });

    // Call integration service to process disbursement
    try {
      const integrationResult = await integrationService.disburseFunds({
        applicationId: caseData.application.id,
        customerId: caseData.application.customerId,
        amount: input.amount,
        currency: input.currency,
        accountNumber: input.accountNumber,
        reference,
      });

      // Update status to PROCESSING
      await prisma.caseActivity.update({
        where: { id: disbursement.id },
        data: {
          metadata: {
            ...(disbursement.metadata as Record<string, unknown>),
            status: 'PROCESSING' as DisbursementStatus,
            transactionId: integrationResult.transactionId,
          } as any,
        },
      });

      log.info(
        { caseId: input.caseId, reference, transactionId: integrationResult.transactionId },
        'Disbursement initiated successfully',
      );

      return {
        id: disbursement.id,
        caseId: input.caseId,
        applicationId: caseData.application.id,
        customerId: caseData.application.customerId,
        amount: input.amount,
        currency: input.currency,
        accountNumber: input.accountNumber,
        status: 'PROCESSING',
        transactionId: integrationResult.transactionId,
        reference,
        initiatedBy: input.initiatedBy,
        initiatedAt: new Date().toISOString(),
        completedAt: null,
        failureReason: null,
      };
    } catch (error) {
      // Mark as FAILED
      await prisma.caseActivity.update({
        where: { id: disbursement.id },
        data: {
          metadata: {
            ...(disbursement.metadata as Record<string, unknown>),
            status: 'FAILED' as DisbursementStatus,
            failureReason: error instanceof Error ? error.message : 'Unknown error',
          } as any,
        },
      });

      log.error({ caseId: input.caseId, error }, 'Disbursement initiation failed');
      throw new BusinessRuleError(
        `Disbursement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Confirm disbursement and transition case to CLOSED
   */
  async confirmDisbursement(disbursementId: string, confirmedBy: string): Promise<DisbursementRecord> {
    const activity = await prisma.caseActivity.findUnique({
      where: { id: disbursementId },
    });

    if (!activity) {
      throw new NotFoundError('Disbursement', disbursementId);
    }

    const metadata = activity.metadata as Record<string, unknown>;
    if (metadata?.type !== 'DISBURSEMENT_RECORD') {
      throw new NotFoundError('Disbursement', disbursementId);
    }

    const currentStatus = metadata.status as DisbursementStatus;
    if (currentStatus !== 'PROCESSING') {
      throw new BusinessRuleError(
        `Cannot confirm disbursement with status '${currentStatus}'. Must be PROCESSING.`,
      );
    }

    const completedAt = new Date().toISOString();

    // Update disbursement to COMPLETED
    await prisma.caseActivity.update({
      where: { id: disbursementId },
      data: {
        metadata: {
          ...metadata,
          status: 'COMPLETED' as DisbursementStatus,
          completedAt,
        } as any,
      },
    });

    // Transition case to CLOSED
    const caseData = await prisma.case.findUnique({
      where: { id: activity.caseId },
    });

    if (caseData && caseData.currentStage === 'DISBURSEMENT') {
      await prisma.$transaction([
        prisma.case.update({
          where: { id: activity.caseId },
          data: {
            currentStage: 'CLOSED',
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        }),
        prisma.stageHistory.create({
          data: {
            caseId: activity.caseId,
            fromStage: 'DISBURSEMENT',
            toStage: 'CLOSED',
            changedBy: confirmedBy,
            reason: 'Disbursement confirmed',
          },
        }),
        prisma.caseActivity.create({
          data: {
            caseId: activity.caseId,
            userId: confirmedBy,
            activityType: 'STAGE_CHANGE',
            description: 'Case closed after successful disbursement',
          },
        }),
      ]);

      log.info({ caseId: activity.caseId }, 'Case closed after disbursement confirmation');
    }

    return {
      id: disbursementId,
      caseId: activity.caseId,
      applicationId: metadata.applicationId as string,
      customerId: metadata.customerId as string,
      amount: metadata.amount as number,
      currency: metadata.currency as string,
      accountNumber: metadata.accountNumber as string,
      status: 'COMPLETED',
      transactionId: metadata.transactionId as string | null,
      reference: metadata.reference as string,
      initiatedBy: metadata.initiatedBy as string,
      initiatedAt: metadata.initiatedAt as string,
      completedAt,
      failureReason: null,
    };
  }

  /**
   * Get disbursement status
   */
  async getDisbursementStatus(disbursementId: string): Promise<DisbursementStatusResult> {
    const activity = await prisma.caseActivity.findUnique({
      where: { id: disbursementId },
    });

    if (!activity) {
      throw new NotFoundError('Disbursement', disbursementId);
    }

    const metadata = activity.metadata as Record<string, unknown>;
    if (metadata?.type !== 'DISBURSEMENT_RECORD') {
      throw new NotFoundError('Disbursement', disbursementId);
    }

    return {
      id: disbursementId,
      status: metadata.status as DisbursementStatus,
      transactionId: metadata.transactionId as string | null,
      reference: metadata.reference as string,
      amount: metadata.amount as number,
      currency: metadata.currency as string,
      initiatedAt: metadata.initiatedAt as string,
      completedAt: metadata.completedAt as string | null,
      failureReason: metadata.failureReason as string | null,
    };
  }
}

export const disbursementService = new DisbursementService();
