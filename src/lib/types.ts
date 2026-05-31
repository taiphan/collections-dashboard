import { z } from 'zod';

export const BUCKET_NAMES = ['B1', 'B2', 'B3', 'B4', 'B5'] as const;
export type BucketName = typeof BUCKET_NAMES[number];

export const BUCKET_LABELS: Record<BucketName, string> = {
  B1: '1-30 Days',
  B2: '31-60 Days',
  B3: '61-90 Days',
  B4: '91-120 Days',
  B5: '120+ Days',
};

export const BUCKET_COLORS: Record<BucketName, string> = {
  B1: '#3B82F6', // blue
  B2: '#F59E0B', // amber
  B3: '#F97316', // orange
  B4: '#EF4444', // red
  B5: '#7C3AED', // purple
};

export const collectionRecordSchema = z.object({
  id: z.string(),
  accountId: z.string().min(1, 'Account ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  bucket: z.enum(BUCKET_NAMES),
  outstandingAmount: z.number().positive('Amount must be positive'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['pending', 'contacted', 'promised', 'paid', 'written-off']),
  notes: z.string().optional(),
  importedAt: z.string(),
});

export type CollectionRecord = z.infer<typeof collectionRecordSchema>;

export const importRowSchema = z.object({
  accountId: z.string().min(1),
  customerName: z.string().min(1),
  bucket: z.enum(BUCKET_NAMES),
  outstandingAmount: z.number().positive(),
  dueDate: z.string().min(1),
  status: z.enum(['pending', 'contacted', 'promised', 'paid', 'written-off']).optional(),
  notes: z.string().optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export interface BucketSummary {
  bucket: BucketName;
  label: string;
  totalAccounts: number;
  totalAmount: number;
  paidAmount: number;
  collectionRate: number;
}

export interface DashboardStats {
  totalOutstanding: number;
  totalAccounts: number;
  totalCollected: number;
  overallCollectionRate: number;
  bucketSummaries: BucketSummary[];
}

export type StatusType = CollectionRecord['status'];

export const STATUS_LABELS: Record<StatusType, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  promised: 'Promise to Pay',
  paid: 'Paid',
  'written-off': 'Written Off',
};

export const STATUS_COLORS: Record<StatusType, string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  promised: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'written-off': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
