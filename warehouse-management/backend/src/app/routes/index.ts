import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { authRateLimit } from '../middleware/rate-limit.middleware.js';
import { authController } from '../controllers/auth.controller.js';
import { catalogController } from '../controllers/catalog.controller.js';
import { skuController } from '../controllers/sku.controller.js';
import { operationController } from '../controllers/operation.controller.js';
import { inventoryController } from '../controllers/inventory.controller.js';
import { reportController } from '../controllers/report.controller.js';
import { analyticsController } from '../controllers/analytics.controller.js';
import { auditController } from '../controllers/audit.controller.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    service: 'WMS - Warehouse Management System',
  });
});

// ============================================================
// AUTH ROUTES
// ============================================================
router.post('/auth/login', authRateLimit, (req, res, next) =>
  authController.login(req, res, next),
);
router.post('/auth/refresh', (req, res, next) =>
  authController.refresh(req, res, next),
);

// ============================================================
// CATALOG ROUTES
// ============================================================
router.get('/catalog-items', authenticate, (req, res, next) =>
  catalogController.list(req, res, next),
);
router.post('/catalog-items', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => catalogController.create(req, res, next),
);
router.get('/catalog-items/:id', authenticate, (req, res, next) =>
  catalogController.getById(req, res, next),
);
router.put('/catalog-items/:id', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => catalogController.update(req, res, next),
);
router.delete('/catalog-items/:id', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => catalogController.delete(req, res, next),
);

// ============================================================
// SKU & BARCODE ROUTES
// ============================================================
router.get('/catalog-items/:itemId/skus', authenticate, (req, res, next) =>
  skuController.listByCatalogItem(req, res, next),
);
router.post('/catalog-items/:itemId/skus', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => skuController.create(req, res, next),
);
router.get('/skus/:id', authenticate, (req, res, next) =>
  skuController.getById(req, res, next),
);
router.post('/skus/:id/barcodes', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => skuController.addBarcode(req, res, next),
);
router.delete('/skus/:skuId/barcodes/:barcodeId', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => skuController.removeBarcode(req, res, next),
);
router.get('/barcodes/lookup/:value', authenticate, (req, res, next) =>
  skuController.lookupBarcode(req, res, next),
);

// ============================================================
// OPERATION ROUTES
// ============================================================
router.get('/operations', authenticate, (req, res, next) =>
  operationController.list(req, res, next),
);
router.post('/operations/import', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'),
  (req, res, next) => operationController.createImport(req, res, next),
);
router.post('/operations/export', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'),
  (req, res, next) => operationController.createExport(req, res, next),
);
router.get('/operations/:id', authenticate, (req, res, next) =>
  operationController.getById(req, res, next),
);
router.post('/operations/:id/submit', authenticate, (req, res, next) =>
  operationController.submit(req, res, next),
);
router.post('/operations/:id/approve', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => operationController.approve(req, res, next),
);
router.post('/operations/:id/reject', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => operationController.reject(req, res, next),
);
router.post('/operations/:id/cancel', authenticate, (req, res, next) =>
  operationController.cancel(req, res, next),
);
router.get('/operations/:id/status-log', authenticate, (req, res, next) =>
  operationController.getStatusLog(req, res, next),
);

// ============================================================
// INVENTORY ROUTES
// ============================================================
router.get('/inventory', authenticate, (req, res, next) =>
  inventoryController.list(req, res, next),
);
router.get('/inventory/:skuId', authenticate, (req, res, next) =>
  inventoryController.getBySkuId(req, res, next),
);
router.put('/inventory/:skuId/threshold', authenticate,
  authorize('ADMIN_WAREHOUSE', 'WAREHOUSE_MANAGER'),
  (req, res, next) => inventoryController.updateThreshold(req, res, next),
);

// ============================================================
// AUDIT ROUTES
// ============================================================
router.get('/audit-logs', authenticate,
  authorize('ADMIN_WAREHOUSE'),
  (req, res, next) => auditController.query(req, res, next),
);

// ============================================================
// REPORT ROUTES
// ============================================================
router.get('/reports', authenticate, (req, res, next) =>
  reportController.generate(req, res, next),
);
router.get('/reports/export/:format', authenticate, (req, res, next) =>
  reportController.export(req, res, next),
);

// ============================================================
// ANALYTICS ROUTES
// ============================================================
router.get('/analytics/moving-averages', authenticate, (req, res, next) =>
  analyticsController.getMovingAverages(req, res, next),
);
router.get('/analytics/top-products', authenticate, (req, res, next) =>
  analyticsController.getTopProducts(req, res, next),
);
router.get('/analytics/turnover', authenticate, (req, res, next) =>
  analyticsController.getTurnover(req, res, next),
);
router.get('/analytics/trends', authenticate, (req, res, next) =>
  analyticsController.getTrends(req, res, next),
);

// ============================================================
// PREDICTION ROUTES
// ============================================================
router.get('/predictions/reorder-alerts', authenticate, (req, res, next) =>
  analyticsController.getReorderAlerts(req, res, next),
);
router.get('/predictions/:skuId', authenticate, (req, res, next) =>
  analyticsController.getForecast(req, res, next),
);

export { router };
