export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unitOfMeasure: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { skus: number };
}

export interface Sku {
  id: string;
  catalogItemId: string;
  code: string;
  size: string | null;
  color: string | null;
  weight: number | null;
  isActive: boolean;
  barcodes: Barcode[];
  inventory: InventoryRecord | null;
}

export interface Barcode {
  id: string;
  value: string;
  format: 'EAN_13' | 'UPC_A' | 'CODE_128';
}

export interface InventoryRecord {
  id: string;
  skuId: string;
  quantity: number;
  location: string | null;
  lowStockThreshold: number;
  updatedAt: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  sku?: Sku & { catalogItem: { id: string; name: string; category: string } };
}

export interface WarehouseOperation {
  id: string;
  operationNumber: string;
  type: 'IMPORT' | 'EXPORT';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  supplierRef: string | null;
  expectedDate: string | null;
  destination: string | null;
  reason: 'SALE' | 'TRANSFER' | 'RETURN' | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  lineItems: OperationLineItem[];
  _count?: { lineItems: number };
}

export interface OperationLineItem {
  id: string;
  skuId: string;
  quantity: number;
  unitCost: number | null;
  unitPrice: number | null;
  sku: { id: string; code: string };
}

export interface ReportData {
  period: { type: string; start: string; end: string };
  totalImports: number;
  totalExports: number;
  netInventoryChange: number;
  topProducts: { skuCode: string; productName: string; totalMoved: number }[];
  financialSummary: { totalImportCost: number; totalExportRevenue: number } | null;
  operationCount: number;
}

export interface ReorderAlert {
  skuId: string;
  skuCode: string;
  productName: string;
  currentStock: number;
  pendingImports: number;
  forecastedDemand: number;
  recommendedReorder: number;
  leadTimeDays: number;
}
