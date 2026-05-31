import { Queue, Worker, Job } from 'bullmq';
import { config } from '../../shared/config/index.js';
import { logger } from '../../shared/utils/logger.js';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

export const reportQueue = new Queue('wms-report', { connection });
export const predictionQueue = new Queue('wms-prediction', { connection });

export interface ReportJob {
  periodType: string;
  startDate: string;
  endDate: string;
}

export interface PredictionJob {
  type: 'REFRESH_ALL' | 'REFRESH_SKU';
  skuId?: string;
}

export async function enqueueReport(job: ReportJob): Promise<void> {
  await reportQueue.add('generate', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  logger.debug({ job }, 'Report job enqueued');
}

export async function enqueuePrediction(job: PredictionJob): Promise<void> {
  await predictionQueue.add(job.type, job, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  });
  logger.debug({ job }, 'Prediction job enqueued');
}

export { Worker, Job, connection };
export type { Queue };
