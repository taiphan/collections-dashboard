import { startCaseProcessingWorker } from './case-processing.worker.js';
import { startDecisionEngineWorker } from './decision-engine.worker.js';
import { startSlaMonitorWorker } from './sla-monitor.worker.js';
import { createChildLogger } from '../../../shared/utils/logger.js';

const log = createChildLogger({ module: 'workers' });

export function startAllWorkers() {
  log.info('Starting background workers...');

  const caseWorker = startCaseProcessingWorker();
  const decisionWorker = startDecisionEngineWorker();
  const slaWorker = startSlaMonitorWorker();

  log.info('All workers started');

  return {
    caseWorker,
    decisionWorker,
    slaWorker,
    async shutdown() {
      log.info('Shutting down workers...');
      await Promise.all([
        caseWorker.close(),
        decisionWorker.close(),
        slaWorker.close(),
      ]);
      log.info('All workers stopped');
    },
  };
}
