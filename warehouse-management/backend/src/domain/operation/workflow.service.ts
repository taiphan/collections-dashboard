import { OperationStatus } from '@prisma/client';
import { BusinessRuleError, ForbiddenError } from '../../shared/errors/index.js';

const ALLOWED_TRANSITIONS: Record<OperationStatus, OperationStatus[]> = {
  DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export class WorkflowService {
  validateTransition(currentStatus: OperationStatus, targetStatus: OperationStatus): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowed.includes(targetStatus)) {
      throw new BusinessRuleError(
        `Cannot transition from '${currentStatus}' to '${targetStatus}'. ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none'}`,
      );
    }
  }

  validateApproval(creatorId: string, approverId: string): void {
    if (creatorId === approverId) {
      throw new ForbiddenError('Operation creator cannot approve their own operation');
    }
  }

  validateRejectionReason(reason: string): void {
    if (reason.length < 10 || reason.length > 500) {
      throw new BusinessRuleError(
        'Rejection reason must be between 10 and 500 characters',
      );
    }
  }

  isModifiable(status: OperationStatus): boolean {
    return status === 'DRAFT';
  }
}

export const workflowService = new WorkflowService();
