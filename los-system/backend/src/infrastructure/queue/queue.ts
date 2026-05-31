import { Queue, Worker, Job } from 'bullmq';
import { config } from '../../shared/config/index.js';
import { logger } from '../../shared/utils/logger.js';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

// Queue definitions
export const caseProcessingQueue = new Queue('case-processing', { connection });
export const slaMonitorQueue = new Queue('sla-monitor', { connection });
export const decisionEngineQueue = new Queue('decision-engine', { connection });
export const notificationQueue = new Queue('notifications', { connection });

// Job types
export interface CaseProcessingJob {
  type: 'STAGE_TRANSITION' | 'AUTO_ASSIGN' | 'SLA_CHECK';
  caseId: string;
  payload: Record<string, unknown>;
}

export interface DecisionEngineJob {
  caseId: string;
  ruleSetId: string;
  applicationData: Record<string, unknown>;
}

export interface NotificationJob {
  type: 'EMAIL' | 'SMS' | 'IN_APP';
  recipientId: string;
  template: string;
  data: Record<string, unknown>;
}

// Helper to add jobs
export async function enqueueCaseProcessing(job: CaseProcessingJob): Promise<void> {
  await caseProcessingQueue.add(job.type, job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
  logger.debug({ jobType: job.type, caseId: job.caseId }, 'Case processing job enqueued');
}

export async function enqueueDecision(job: DecisionEngineJob): Promise<void> {
  await decisionEngineQueue.add('evaluate', job, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 500 },
  });
}

export async function enqueueNotification(job: NotificationJob): Promise<void> {
  await notificationQueue.add(job.type, job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

export { Worker, Job };
export type { Queue };
