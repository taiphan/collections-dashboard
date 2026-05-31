import { Worker, Job, Queue } from 'bullmq';
import { prisma } from '../../database/prisma.js';
import { createChildLogger } from '../../../shared/utils/logger.js';
import { config } from '../../../shared/config/index.js';

const log = createChildLogger({ module: 'sla-monitor-worker' });

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

export interface SlaMonitorJob {
  type: 'SCAN_ALL' | 'CHECK_SINGLE';
  caseId?: string;
}

export function startSlaMonitorWorker() {
  const slaQueue = new Queue<SlaMonitorJob>('sla-monitor', { connection });

  // Schedule periodic SLA scan every 5 minutes
  slaQueue.add(
    'periodic-scan',
    { type: 'SCAN_ALL' },
    {
      repeat: { every: 5 * 60 * 1000 }, // 5 minutes
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  const worker = new Worker<SlaMonitorJob>(
    'sla-monitor',
    async (job: Job<SlaMonitorJob>) => {
      if (job.data.type === 'SCAN_ALL') {
        await scanAllActiveCases();
      } else if (job.data.type === 'CHECK_SINGLE' && job.data.caseId) {
        await checkSingleCase(job.data.caseId);
      }
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'SLA monitor job failed');
  });

  log.info('SLA monitor worker started (scanning every 5 minutes)');
  return worker;
}

async function scanAllActiveCases() {
  const now = new Date();

  // Find cases approaching or past SLA deadline
  const atRiskCases = await prisma.case.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      slaDeadline: { not: null },
      currentStage: { not: 'CLOSED' },
    },
    include: {
      application: { include: { product: true } },
    },
  });

  let warnings = 0;
  let breaches = 0;

  for (const caseData of atRiskCases) {
    if (!caseData.slaDeadline) continue;

    const slaConfig = await prisma.slaConfig.findUnique({
      where: {
        stage_productType: {
          stage: caseData.currentStage,
          productType: caseData.application.product.productType,
        },
      },
    });

    if (!slaConfig) continue;

    const deadline = new Date(caseData.slaDeadline);
    const warningTime = new Date(
      deadline.getTime() - slaConfig.warningHours * 3600000,
    );

    if (now >= deadline && !caseData.slaBreached) {
      // Breach
      await prisma.case.update({
        where: { id: caseData.id },
        data: { slaBreached: true, status: 'ESCALATED' },
      });

      await prisma.caseActivity.create({
        data: {
          caseId: caseData.id,
          activityType: 'SLA_BREACH',
          description: `SLA BREACHED: Stage ${caseData.currentStage} exceeded ${slaConfig.breachHours}h limit. Case escalated.`,
        },
      });

      breaches++;
    } else if (now >= warningTime && !caseData.slaBreached) {
      // Check if warning already issued recently (within last hour)
      const recentWarning = await prisma.caseActivity.findFirst({
        where: {
          caseId: caseData.id,
          activityType: 'SLA_WARNING',
          createdAt: { gte: new Date(now.getTime() - 3600000) },
        },
      });

      if (!recentWarning) {
        await prisma.caseActivity.create({
          data: {
            caseId: caseData.id,
            activityType: 'SLA_WARNING',
            description: `SLA WARNING: Stage ${caseData.currentStage} approaching deadline (${slaConfig.breachHours}h limit)`,
          },
        });
        warnings++;
      }
    }
  }

  if (warnings > 0 || breaches > 0) {
    log.info(
      { totalCases: atRiskCases.length, warnings, breaches },
      'SLA scan completed',
    );
  }
}

async function checkSingleCase(caseId: string) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { application: { include: { product: true } } },
  });

  if (!caseData || !caseData.slaDeadline) return;

  const now = new Date();
  const deadline = new Date(caseData.slaDeadline);

  if (now >= deadline && !caseData.slaBreached) {
    await prisma.case.update({
      where: { id: caseId },
      data: { slaBreached: true },
    });

    log.warn({ caseId }, 'Single case SLA breached');
  }
}
