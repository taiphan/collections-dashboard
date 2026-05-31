import { Worker, Job } from 'bullmq';
import { prisma } from '../../database/prisma.js';
import { decisionEngineService } from '../../../domain/decision-engine/decision-engine.service.js';
import { createChildLogger } from '../../../shared/utils/logger.js';
import { config } from '../../../shared/config/index.js';
import type { DecisionEngineJob } from '../queue.js';

const log = createChildLogger({ module: 'decision-engine-worker' });

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

export function startDecisionEngineWorker() {
  const worker = new Worker<DecisionEngineJob>(
    'decision-engine',
    async (job: Job<DecisionEngineJob>) => {
      const { caseId, ruleSetId, applicationData } = job.data;

      log.info({ jobId: job.id, caseId }, 'Evaluating decision');

      // Get full application context
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          application: {
            include: {
              customer: true,
              product: true,
            },
          },
        },
      });

      if (!caseData) {
        throw new Error(`Case ${caseId} not found`);
      }

      const customer = caseData.application.customer;
      const financialInfo = customer.financialInfo as Record<string, number> | null;
      const employmentInfo = customer.employmentInfo as Record<string, number> | null;

      // Build evaluation context
      const context = {
        requestedAmount: Number(caseData.application.requestedAmount),
        requestedTenure: caseData.application.requestedTenure,
        monthlyIncome: financialInfo?.monthlyIncome || 0,
        existingDebt: financialInfo?.existingDebt || 0,
        creditScore: (applicationData.creditScore as number) || undefined,
        employmentYears: employmentInfo?.yearsEmployed || undefined,
        age: customer.dateOfBirth
          ? Math.floor((Date.now() - new Date(customer.dateOfBirth).getTime()) / 31557600000)
          : undefined,
        ...applicationData,
      };

      // Run decision engine
      const result = await decisionEngineService.evaluateApplication(
        caseId,
        'UNDERWRITING',
        context,
      );

      // Log activity
      await prisma.caseActivity.create({
        data: {
          caseId,
          activityType: 'DECISION_MADE',
          description: `Automated decision: ${result.outcome} (Score: ${result.score}/100)`,
          metadata: {
            outcome: result.outcome,
            score: result.score,
            reasonCount: result.reasoning.length,
          },
        },
      });

      // If auto-approved with high confidence, complete the underwriting task
      if (result.outcome === 'APPROVED' && result.score >= 80) {
        const autoTask = await prisma.caseTask.findFirst({
          where: {
            caseId,
            stage: 'UNDERWRITING',
            taskType: 'AUTOMATED',
            status: 'PENDING',
            title: { contains: 'Risk assessment' },
          },
        });

        if (autoTask) {
          await prisma.caseTask.update({
            where: { id: autoTask.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              result: { outcome: result.outcome, score: result.score },
            },
          });
        }
      }

      log.info(
        { caseId, outcome: result.outcome, score: result.score },
        'Decision evaluation completed',
      );

      return result;
    },
    {
      connection,
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'Decision engine job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Decision engine job failed');
  });

  log.info('Decision engine worker started');
  return worker;
}
