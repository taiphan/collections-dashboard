import { z } from 'zod';

export const DATA_SOURCES = ['Card V+', 'Loan Finacle'] as const;
export type DataSource = typeof DATA_SOURCES[number];

export const SOURCE_COLORS: Record<DataSource, string> = {
  'Card V+': '#3B82F6',
  'Loan Finacle': '#8B5CF6',
};

export const pipelineRecordSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  source: z.enum(DATA_SOURCES),
  bodCount: z.number().min(0), // Beginning of Day count from source
  pegaCount: z.number().min(0), // Count received in Pega
  difference: z.number(), // bodCount - pegaCount
  differencePercent: z.number(), // percentage difference
  importedAt: z.string(),
});

export type PipelineRecord = z.infer<typeof pipelineRecordSchema>;

export const importRowSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  source: z.enum(DATA_SOURCES),
  bodCount: z.number().min(0, 'BOD count must be >= 0'),
  pegaCount: z.number().min(0, 'Pega count must be >= 0'),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export interface DailySummary {
  date: string;
  cardVPlusBod: number;
  cardVPlusPega: number;
  cardVPlusDiff: number;
  cardVPlusDiffPercent: number;
  loanFinaleBod: number;
  loanFinalePega: number;
  loanFinaleDiff: number;
  loanFinaleDiffPercent: number;
  totalBod: number;
  totalPega: number;
  totalDiff: number;
  totalDiffPercent: number;
}

export interface TrendData {
  date: string;
  cardVPlusDiffPercent: number;
  loanFinaleDiffPercent: number;
  totalDiffPercent: number;
}

export interface HeatmapCell {
  date: string;
  source: DataSource;
  value: number; // difference percentage
  severity: 'good' | 'warning' | 'danger' | 'critical';
}

export function getSeverity(diffPercent: number): HeatmapCell['severity'] {
  const abs = Math.abs(diffPercent);
  if (abs <= 1) return 'good';
  if (abs <= 3) return 'warning';
  if (abs <= 5) return 'danger';
  return 'critical';
}

export const SEVERITY_COLORS: Record<HeatmapCell['severity'], string> = {
  good: '#10B981',
  warning: '#F59E0B',
  danger: '#F97316',
  critical: '#EF4444',
};

export const SEVERITY_BG: Record<HeatmapCell['severity'], string> = {
  good: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200',
  warning: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
  danger: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200',
  critical: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200',
};
