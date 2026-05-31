// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Domain Types
// ============================================================

export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'UNDERWRITER'
  | 'LOAN_OFFICER'
  | 'COMPLIANCE_OFFICER'
  | 'VIEWER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
}

export type CaseStage =
  | 'INTAKE'
  | 'VERIFICATION'
  | 'UNDERWRITING'
  | 'APPROVAL'
  | 'DOCUMENTATION'
  | 'DISBURSEMENT'
  | 'CLOSED';

export type CaseStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'ESCALATED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'DISBURSED'
  | 'CLOSED';

export type ApplicationChannel = 'WEB' | 'MOBILE' | 'BRANCH' | 'API';

export interface Customer {
  id: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  kycStatus: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  productType: string;
  minAmount: number;
  maxAmount: number;
  baseInterestRate: number;
}

export interface Application {
  id: string;
  applicationNumber: string;
  customerId: string;
  productId: string;
  requestedAmount: number;
  requestedTenure: number;
  purpose?: string;
  channel: ApplicationChannel;
  status: ApplicationStatus;
  submittedAt?: string;
  customer?: Customer;
  product?: LoanProduct;
}

export interface Case {
  id: string;
  caseNumber: string;
  applicationId: string;
  assignedTo?: string;
  currentStage: CaseStage;
  status: CaseStatus;
  priority: CasePriority;
  slaDeadline?: string;
  slaBreached: boolean;
  startedAt: string;
  application?: Application;
  assignedOfficer?: { firstName: string; lastName: string };
  tasks?: CaseTask[];
  activities?: CaseActivity[];
}

export interface CaseTask {
  id: string;
  stage: CaseStage;
  title: string;
  description?: string;
  taskType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  dueDate?: string;
}

export interface CaseActivity {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export interface DashboardStats {
  byStage: Array<{ currentStage: CaseStage; _count: number }>;
  byStatus: Array<{ status: CaseStatus; _count: number }>;
  slaBreached: number;
  totalActive: number;
}
