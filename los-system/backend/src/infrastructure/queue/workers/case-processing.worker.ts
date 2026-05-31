import { Worker, Job } from 'bullmq';
import { prisma } from '../../database/prisma.js';
import { createChildLogger } from '../../../shared/utils/logger.js';
import { config } from '../../../shared/config/index.js';
import type { CaseProcessingJob } from '../queue.js';

const log = createChildLogger({ module: 'case-processing-worker' });

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

export function startCaseProcessingWorker() {
  const worker = new Worker<CaseProcessingJob>(
    'case-processing',
    async (job: Job<CaseProcessingJob>) => {
      const { type, caseId, payload } = job.data;

      log.info({ jobId: job.id, type, caseId }, 'Processing case job');

      switch (type) {
        case 'STAGE_TRANSITION':
          await handleStageTransition(caseId, payload);
          break;
        case 'AUTO_ASSIGN':
          await handleAutoAssign(caseId, payload);
          break;
        case 'SLA_CHECK':
          await handleSlaCheck(caseId, payload);
          break;
        default:
          log.warn({ type }, 'Unknown job type');
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 },
    },
  );

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'Case processing job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Case processing job failed');
  });

  log.info('Case processing worker started');
  return worker;
}

async function handleStageTransition(
  caseId: string,
  payload: Record<string, unknown>,
) {
  // Post-transition hooks: create tasks, update SLA, send notifications
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { application: { include: { product: true } } },
  });

  if (!caseData) return;

  // Calculate SLA deadline based on config
  const slaConfig = await prisma.slaConfig.findUnique({
    where: {
      stage_productType: {
        stage: caseData.currentStage,
        productType: caseData.application.product.productType,
      },
    },
  });

  if (slaConfig) {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + slaConfig.breachHours);

    await prisma.case.update({
      where: { id: caseId },
      data: { slaDeadline: deadline, slaBreached: false },
    });

    log.info(
      { caseId, stage: caseData.currentStage, deadline },
      'SLA deadline set',
    );
  }
}

async function handleAutoAssign(
  caseId: string,
  payload: Record<string, unknown>,
) {
  const caseData = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseData || caseData.assignedTo) return;

  // Round-robin assignment: find the officer with fewest active cases
  const stage = caseData.currentStage;
  const targetRole = stage === 'UNDERWRITING' ? 'UNDERWRITER' : 'LOAN_OFFICER';

  const officers = await prisma.user.findMany({
    where: { role: targetRole, isActive: true },
    include: {
      assignedCases: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      },
    },
  });

  if (officers.length === 0) return;

  // Sort by workload (fewest cases first)
  officers.sort((a, b) => a.assignedCases.length - b.assignedCases.length);
  const assignee = officers[0];

  await prisma.case.update({
    where: { id: caseId },
    data: { assignedTo: assignee.id },
  });

  await prisma.caseActivity.create({
    data: {
      caseId,
      activityType: 'ASSIGNMENT',
      description: `Auto-assigned to ${assignee.firstName} ${assignee.lastName} (${targetRole})`,
      userId: assignee.id,
    },
  });

  log.info(
    { caseId, assignedTo: assignee.id, role: targetRole },
    'Case auto-assigned',
  );
}

async function handleSlaCheck(
  caseId: string,
  payload: Record<string, unknown>,
) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { application: { include: { product: true } } },
  });

  if (!caseData || caseData.status === 'COMPLETED' || caseData.status === 'CANCELLED') {
    return;
  }

  const slaConfig = await prisma.slaConfig.findUnique({
    where: {
      stage_productType: {
        stage: caseData.currentStage,
        productType: caseData.application.product.productType,
      },
    },
  });

  if (!slaConfig || !caseData.slaDeadline) return;

  const now = new Date();
  const deadline = new Date(caseData.slaDeadline);
  const warningTime = new Date(deadline.getTime() - slaConfig.warningHours * 3600000);

  if (now >= deadline && !caseData.slaBreached) {
    // SLA breached
    await prisma.case.update({
      where: { id: caseId },
      data: { slaBreached: true },
    });

    await prisma.caseActivity.create({
      data: {
        caseId,
        activityType: 'SLA_BREACH',
        description: `SLA breached for stage ${caseData.currentStage}. Escalating to ${slaConfig.escalateTo}.`,
      },
    });

    log.warn({ caseId, stage: caseData.currentStage }, 'SLA breached');
  } else if (now >= warningTime) {
    // SLA warning
    await prisma.caseActivity.create({
      data: {
        caseId,
        activityType: 'SLA_WARNING',
        description: `SLA warning: approaching deadline for stage ${caseData.currentStage}`,
      },
    });

    log.info({ caseId, stage: caseData.currentStage }, 'SLA warning issued');
  }
}
