import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { authController } from '../controllers/auth.controller.js';
import { applicationController } from '../controllers/application.controller.js';
import { caseController } from '../controllers/case.controller.js';
import { customerController } from '../controllers/customer.controller.js';
import { documentController } from '../controllers/document.controller.js';
import { productController } from '../controllers/product.controller.js';
import { integrationController } from '../controllers/integration.controller.js';
import { reportingController } from '../controllers/reporting.controller.js';
import { preScreeningController } from '../controllers/pre-screening.controller.js';
import { openBankingController } from '../controllers/open-banking.controller.js';
import { strategyController } from '../controllers/strategy.controller.js';
import { esgController } from '../controllers/esg.controller.js';
import { complianceController } from '../controllers/compliance.controller.js';
import { disbursementController } from '../controllers/disbursement.controller.js';
import { digitalOnboardingController } from '../controllers/digital-onboarding.controller.js';
import { customerManagementController } from '../controllers/customer-management.controller.js';
import { collectionController } from '../controllers/collection.controller.js';
import { advancedAnalyticsController } from '../controllers/advanced-analytics.controller.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'LOS - Digital Experience Platform for Lending',
    modules: {
      origination: 'live',
      decisionEngine: 'live',
      openBanking: 'live',
      esg: 'live',
      compliance: 'live',
      bpmnWorkflow: 'live',
      digitalOnboarding: 'beta',
      genAI: 'beta',
      collection: 'planned',
      customerManagement: 'planned',
    },
  });
});

// ============================================================
// AUTH ROUTES
// ============================================================
router.post('/auth/login', authRateLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/auth/register', authenticate, authorize('ADMIN', 'MANAGER'), (req, res, next) => authController.register(req, res, next));
router.get('/auth/me', authenticate, (req, res, next) => authController.me(req, res, next));

// ============================================================
// APPLICATION ROUTES
// ============================================================
router.post(
  '/applications',
  authenticate,
  (req, res, next) => applicationController.create(req, res, next),
);
router.get(
  '/applications',
  authenticate,
  (req, res, next) => applicationController.list(req, res, next),
);
router.get(
  '/applications/:id',
  authenticate,
  (req, res, next) => applicationController.getById(req, res, next),
);
router.post(
  '/applications/:id/submit',
  authenticate,
  (req, res, next) => applicationController.submit(req, res, next),
);

// ============================================================
// CASE ROUTES
// ============================================================
router.get(
  '/cases',
  authenticate,
  (req, res, next) => caseController.list(req, res, next),
);
router.get(
  '/cases/dashboard',
  authenticate,
  (req, res, next) => caseController.dashboard(req, res, next),
);
router.get(
  '/cases/:id',
  authenticate,
  (req, res, next) => caseController.getById(req, res, next),
);
router.post(
  '/cases/:id/transition',
  authenticate,
  authorize('LOAN_OFFICER', 'UNDERWRITER', 'MANAGER', 'ADMIN'),
  (req, res, next) => caseController.transitionStage(req, res, next),
);
router.post(
  '/cases/:id/assign',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => caseController.assign(req, res, next),
);
router.patch(
  '/cases/:id/priority',
  authenticate,
  authorize('LOAN_OFFICER', 'MANAGER', 'ADMIN'),
  (req, res, next) => caseController.updatePriority(req, res, next),
);

// Case task routes
router.patch(
  '/cases/:caseId/tasks/:taskId',
  authenticate,
  async (req, res, next) => {
    try {
      const { taskService } = await import('../../domain/case-management/task.service.js');
      const { taskId } = req.params as { taskId: string };
      const { status, result } = req.body;

      const updated = await taskService.updateTaskStatus({
        taskId,
        status: status || 'COMPLETED',
        result,
        completedBy: req.user!.userId,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================
// CUSTOMER ROUTES
// ============================================================
router.post(
  '/customers',
  authenticate,
  (req, res, next) => customerController.create(req, res, next),
);
router.get(
  '/customers',
  authenticate,
  (req, res, next) => customerController.search(req, res, next),
);
router.get(
  '/customers/:id',
  authenticate,
  (req, res, next) => customerController.getById(req, res, next),
);
router.patch(
  '/customers/:id/kyc',
  authenticate,
  authorize('COMPLIANCE_OFFICER', 'MANAGER', 'ADMIN'),
  (req, res, next) => customerController.updateKyc(req, res, next),
);
router.get(
  '/customers/:id/risk-profile',
  authenticate,
  (req, res, next) => customerController.riskProfile(req, res, next),
);

// ============================================================
// DOCUMENT ROUTES
// ============================================================
router.post(
  '/documents',
  authenticate,
  (req, res, next) => documentController.upload(req, res, next),
);
router.patch(
  '/documents/:id/verify',
  authenticate,
  authorize('LOAN_OFFICER', 'UNDERWRITER', 'COMPLIANCE_OFFICER', 'MANAGER', 'ADMIN'),
  (req, res, next) => documentController.verify(req, res, next),
);
router.get(
  '/applications/:applicationId/documents',
  authenticate,
  (req, res, next) => documentController.getByApplication(req, res, next),
);
router.get(
  '/applications/:applicationId/documents/checklist',
  authenticate,
  (req, res, next) => documentController.checklist(req, res, next),
);
router.get(
  '/applications/:applicationId/documents/completeness',
  authenticate,
  (req, res, next) => documentController.completeness(req, res, next),
);

// ============================================================
// PRODUCT ROUTES
// ============================================================
router.post(
  '/products',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => productController.create(req, res, next),
);
router.patch(
  '/products/:id',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => productController.update(req, res, next),
);
router.get(
  '/products',
  authenticate,
  (req, res, next) => productController.list(req, res, next),
);
router.get(
  '/products/active',
  authenticate,
  (req, res, next) => productController.getActive(req, res, next),
);
router.get(
  '/products/:id',
  authenticate,
  (req, res, next) => productController.getById(req, res, next),
);
router.post(
  '/products/:id/eligibility',
  authenticate,
  (req, res, next) => productController.checkEligibility(req, res, next),
);
router.post(
  '/products/amortization',
  authenticate,
  (req, res, next) => productController.amortization(req, res, next),
);

// ============================================================
// INTEGRATION ROUTES
// ============================================================
router.post(
  '/integrations/credit-check',
  authenticate,
  authorize('UNDERWRITER', 'MANAGER', 'ADMIN'),
  (req, res, next) => integrationController.creditCheck(req, res, next),
);
router.post(
  '/integrations/kyc-verify',
  authenticate,
  authorize('LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'MANAGER', 'ADMIN'),
  (req, res, next) => integrationController.kycVerify(req, res, next),
);
router.post(
  '/integrations/disburse',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => integrationController.disburse(req, res, next),
);

// ============================================================
// PRE-SCREENING ROUTES
// ============================================================
router.post(
  '/pre-screening/check',
  authenticate,
  (req, res, next) => preScreeningController.check(req, res, next),
);
router.get(
  '/pre-screening/:id/result',
  authenticate,
  (req, res, next) => preScreeningController.getResult(req, res, next),
);

// ============================================================
// OPEN BANKING ROUTES
// ============================================================
router.post(
  '/open-banking/connect',
  authenticate,
  (req, res, next) => openBankingController.connect(req, res, next),
);
router.get(
  '/open-banking/:customerId/accounts',
  authenticate,
  (req, res, next) => openBankingController.getAccounts(req, res, next),
);
router.get(
  '/open-banking/:customerId/transactions',
  authenticate,
  (req, res, next) => openBankingController.getTransactions(req, res, next),
);
router.post(
  '/open-banking/:customerId/affordability',
  authenticate,
  (req, res, next) => openBankingController.affordability(req, res, next),
);
router.get(
  '/open-banking/categories',
  authenticate,
  (req, res, next) => openBankingController.getCategories(req, res, next),
);

// ============================================================
// STRATEGY (DECISION ENGINE) ROUTES
// ============================================================
router.post(
  '/strategies',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => strategyController.create(req, res, next),
);
router.get(
  '/strategies',
  authenticate,
  (req, res, next) => strategyController.list(req, res, next),
);
router.get(
  '/strategies/:id',
  authenticate,
  (req, res, next) => strategyController.getById(req, res, next),
);
router.post(
  '/strategies/:id/deploy',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => strategyController.deploy(req, res, next),
);
router.post(
  '/strategies/:id/simulate',
  authenticate,
  authorize('UNDERWRITER', 'MANAGER', 'ADMIN'),
  (req, res, next) => strategyController.simulate(req, res, next),
);
router.post(
  '/strategies/champion-challenger',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => strategyController.setupChampionChallenger(req, res, next),
);

// ============================================================
// ESG ROUTES
// ============================================================
router.post(
  '/esg/score',
  authenticate,
  (req, res, next) => esgController.calculateScore(req, res, next),
);
router.get(
  '/esg/criteria',
  authenticate,
  (req, res, next) => esgController.getCriteria(req, res, next),
);

// ============================================================
// COMPLIANCE ROUTES
// ============================================================
router.post(
  '/compliance/screen',
  authenticate,
  (req, res, next) => complianceController.screen(req, res, next),
);
router.get(
  '/compliance/audit/:caseId',
  authenticate,
  (req, res, next) => complianceController.getAuditTrail(req, res, next),
);

// ============================================================
// DISBURSEMENT ROUTES
// ============================================================
router.post(
  '/disbursements/initiate',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => disbursementController.initiate(req, res, next),
);
router.get(
  '/disbursements/:id/status',
  authenticate,
  (req, res, next) => disbursementController.getStatus(req, res, next),
);
router.post(
  '/disbursements/:id/confirm',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => disbursementController.confirm(req, res, next),
);

// ============================================================
// DIGITAL ONBOARDING ROUTES
// ============================================================
router.post(
  '/onboarding/start',
  authenticate,
  (req, res, next) => digitalOnboardingController.start(req, res, next),
);
router.get(
  '/onboarding/:sessionId',
  authenticate,
  (req, res, next) => digitalOnboardingController.getSession(req, res, next),
);
router.post(
  '/onboarding/:sessionId/verify-identity',
  authenticate,
  (req, res, next) => digitalOnboardingController.verifyIdentity(req, res, next),
);
router.post(
  '/onboarding/:sessionId/biometric',
  authenticate,
  (req, res, next) => digitalOnboardingController.biometric(req, res, next),
);
router.post(
  '/onboarding/:sessionId/complete',
  authenticate,
  (req, res, next) => digitalOnboardingController.complete(req, res, next),
);

// ============================================================
// CUSTOMER MANAGEMENT ROUTES
// ============================================================
router.get(
  '/customer-management/portfolio',
  authenticate,
  (req, res, next) => customerManagementController.getPortfolio(req, res, next),
);
router.get(
  '/customer-management/:customerId/health',
  authenticate,
  (req, res, next) => customerManagementController.getHealthScore(req, res, next),
);
router.get(
  '/customer-management/alerts',
  authenticate,
  (req, res, next) => customerManagementController.getAlerts(req, res, next),
);
router.post(
  '/customer-management/alerts/:alertId/resolve',
  authenticate,
  (req, res, next) => customerManagementController.resolveAlert(req, res, next),
);
router.get(
  '/customer-management/:customerId/timeline',
  authenticate,
  (req, res, next) => customerManagementController.getTimeline(req, res, next),
);

// ============================================================
// COLLECTION ROUTES
// ============================================================
router.post(
  '/collection/cases',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => collectionController.createCase(req, res, next),
);
router.get(
  '/collection/cases',
  authenticate,
  (req, res, next) => collectionController.listCases(req, res, next),
);
router.get(
  '/collection/cases/:id',
  authenticate,
  (req, res, next) => collectionController.getCase(req, res, next),
);
router.post(
  '/collection/cases/:id/contact',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => collectionController.recordContact(req, res, next),
);
router.post(
  '/collection/cases/:id/arrangement',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => collectionController.createArrangement(req, res, next),
);
router.get(
  '/collection/metrics',
  authenticate,
  (req, res, next) => collectionController.getMetrics(req, res, next),
);

// ============================================================
// ADVANCED ANALYTICS ROUTES
// ============================================================
router.get(
  '/analytics/models',
  authenticate,
  (req, res, next) => advancedAnalyticsController.listModels(req, res, next),
);
router.post(
  '/analytics/models/:modelId/predict',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => advancedAnalyticsController.predict(req, res, next),
);
router.get(
  '/analytics/models/:modelId/governance',
  authenticate,
  (req, res, next) => advancedAnalyticsController.getGovernance(req, res, next),
);
router.get(
  '/analytics/models/:modelId/drift',
  authenticate,
  (req, res, next) => advancedAnalyticsController.checkDrift(req, res, next),
);
router.post(
  '/analytics/models/compare',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => advancedAnalyticsController.compareModels(req, res, next),
);

// ============================================================
// REPORTING ROUTES
// ============================================================
router.get(
  '/reports/pipeline',
  authenticate,
  (req, res, next) => reportingController.pipeline(req, res, next),
);
router.get(
  '/reports/tat',
  authenticate,
  (req, res, next) => reportingController.tat(req, res, next),
);
router.get(
  '/reports/officers',
  authenticate,
  authorize('MANAGER', 'ADMIN'),
  (req, res, next) => reportingController.officerPerformance(req, res, next),
);
router.get(
  '/reports/portfolio',
  authenticate,
  (req, res, next) => reportingController.portfolio(req, res, next),
);

export { router };
