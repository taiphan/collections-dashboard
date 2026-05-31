import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PipelineRecord,
  DataSource,
  DailySummary,
  TrendData,
  HeatmapCell,
  getSeverity,
} from './types';
import { format, subDays, parseISO } from 'date-fns';

interface PipelineState {
  records: PipelineRecord[];
  addRecords: (records: PipelineRecord[]) => void;
  clearAllRecords: () => void;
  getDailySummaries: (days?: number) => DailySummary[];
  getTrendData: (days?: number) => TrendData[];
  getHeatmapData: (days?: number) => HeatmapCell[];
  getTodayVs7DayComparison: () => ComparisonData;
  getLatestDate: () => string | null;
}

export interface ComparisonData {
  today: DailySummary | null;
  sevenDayAvg: DailySummary | null;
  trend: 'improving' | 'stable' | 'degrading';
  trendDetails: {
    source: DataSource;
    todayDiff: number;
    avgDiff: number;
    direction: 'improving' | 'stable' | 'degrading';
  }[];
}

function calculateDiffPercent(bod: number, pega: number): number {
  if (bod === 0) return 0;
  return ((bod - pega) / bod) * 100;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecords: (newRecords) =>
        set((state) => {
          // Deduplicate by date + source
          const existingKeys = new Set(
            state.records.map((r) => `${r.date}-${r.source}`)
          );
          const unique = newRecords.filter(
            (r) => !existingKeys.has(`${r.date}-${r.source}`)
          );
          return { records: [...state.records, ...unique] };
        }),

      clearAllRecords: () => set({ records: [] }),

      getLatestDate: () => {
        const { records } = get();
        if (records.length === 0) return null;
        const dates = records.map((r) => r.date).sort();
        return dates[dates.length - 1];
      },

      getDailySummaries: (days = 7) => {
        const { records } = get();
        if (records.length === 0) return [];

        const latestDate = records
          .map((r) => r.date)
          .sort()
          .pop();
        if (!latestDate) return [];

        const startDate = format(subDays(parseISO(latestDate), days - 1), 'yyyy-MM-dd');

        const filteredRecords = records.filter(
          (r) => r.date >= startDate && r.date <= latestDate
        );

        const dateMap = new Map<string, PipelineRecord[]>();
        filteredRecords.forEach((r) => {
          const existing = dateMap.get(r.date) || [];
          existing.push(r);
          dateMap.set(r.date, existing);
        });

        const summaries: DailySummary[] = [];
        dateMap.forEach((dayRecords, date) => {
          const cardVPlus = dayRecords.find((r) => r.source === 'Card V+');
          const loanFinacle = dayRecords.find((r) => r.source === 'Loan Finacle');

          const cardVPlusBod = cardVPlus?.bodCount || 0;
          const cardVPlusPega = cardVPlus?.pegaCount || 0;
          const loanFinaleBod = loanFinacle?.bodCount || 0;
          const loanFinalePega = loanFinacle?.pegaCount || 0;

          summaries.push({
            date,
            cardVPlusBod,
            cardVPlusPega,
            cardVPlusDiff: cardVPlusBod - cardVPlusPega,
            cardVPlusDiffPercent: calculateDiffPercent(cardVPlusBod, cardVPlusPega),
            loanFinaleBod,
            loanFinalePega,
            loanFinaleDiff: loanFinaleBod - loanFinalePega,
            loanFinaleDiffPercent: calculateDiffPercent(loanFinaleBod, loanFinalePega),
            totalBod: cardVPlusBod + loanFinaleBod,
            totalPega: cardVPlusPega + loanFinalePega,
            totalDiff: (cardVPlusBod - cardVPlusPega) + (loanFinaleBod - loanFinalePega),
            totalDiffPercent: calculateDiffPercent(
              cardVPlusBod + loanFinaleBod,
              cardVPlusPega + loanFinalePega
            ),
          });
        });

        return summaries.sort((a, b) => a.date.localeCompare(b.date));
      },

      getTrendData: (days = 7) => {
        const summaries = get().getDailySummaries(days);
        return summaries.map((s) => ({
          date: s.date,
          cardVPlusDiffPercent: s.cardVPlusDiffPercent,
          loanFinaleDiffPercent: s.loanFinaleDiffPercent,
          totalDiffPercent: s.totalDiffPercent,
        }));
      },

      getHeatmapData: (days = 7) => {
        const summaries = get().getDailySummaries(days);
        const cells: HeatmapCell[] = [];

        summaries.forEach((s) => {
          cells.push({
            date: s.date,
            source: 'Card V+',
            value: s.cardVPlusDiffPercent,
            severity: getSeverity(s.cardVPlusDiffPercent),
          });
          cells.push({
            date: s.date,
            source: 'Loan Finacle',
            value: s.loanFinaleDiffPercent,
            severity: getSeverity(s.loanFinaleDiffPercent),
          });
        });

        return cells;
      },

      getTodayVs7DayComparison: () => {
        const summaries = get().getDailySummaries(8); // Get 8 days to have today + 7 prior
        if (summaries.length === 0) {
          return {
            today: null,
            sevenDayAvg: null,
            trend: 'stable' as const,
            trendDetails: [],
          };
        }

        const today = summaries[summaries.length - 1];
        const prior = summaries.slice(0, -1);

        if (prior.length === 0) {
          return {
            today,
            sevenDayAvg: null,
            trend: 'stable' as const,
            trendDetails: [],
          };
        }

        const avgCardVPlusDiff =
          prior.reduce((sum, s) => sum + s.cardVPlusDiffPercent, 0) / prior.length;
        const avgLoanFinaleDiff =
          prior.reduce((sum, s) => sum + s.loanFinaleDiffPercent, 0) / prior.length;
        const avgTotalDiff =
          prior.reduce((sum, s) => sum + s.totalDiffPercent, 0) / prior.length;

        const sevenDayAvg: DailySummary = {
          date: 'avg',
          cardVPlusBod: Math.round(prior.reduce((s, p) => s + p.cardVPlusBod, 0) / prior.length),
          cardVPlusPega: Math.round(prior.reduce((s, p) => s + p.cardVPlusPega, 0) / prior.length),
          cardVPlusDiff: Math.round(prior.reduce((s, p) => s + p.cardVPlusDiff, 0) / prior.length),
          cardVPlusDiffPercent: avgCardVPlusDiff,
          loanFinaleBod: Math.round(prior.reduce((s, p) => s + p.loanFinaleBod, 0) / prior.length),
          loanFinalePega: Math.round(prior.reduce((s, p) => s + p.loanFinalePega, 0) / prior.length),
          loanFinaleDiff: Math.round(prior.reduce((s, p) => s + p.loanFinaleDiff, 0) / prior.length),
          loanFinaleDiffPercent: avgLoanFinaleDiff,
          totalBod: Math.round(prior.reduce((s, p) => s + p.totalBod, 0) / prior.length),
          totalPega: Math.round(prior.reduce((s, p) => s + p.totalPega, 0) / prior.length),
          totalDiff: Math.round(prior.reduce((s, p) => s + p.totalDiff, 0) / prior.length),
          totalDiffPercent: avgTotalDiff,
        };

        const getDirection = (todayVal: number, avgVal: number) => {
          const diff = Math.abs(todayVal) - Math.abs(avgVal);
          if (diff < -0.5) return 'improving' as const;
          if (diff > 0.5) return 'degrading' as const;
          return 'stable' as const;
        };

        const trendDetails = [
          {
            source: 'Card V+' as DataSource,
            todayDiff: today.cardVPlusDiffPercent,
            avgDiff: avgCardVPlusDiff,
            direction: getDirection(today.cardVPlusDiffPercent, avgCardVPlusDiff),
          },
          {
            source: 'Loan Finacle' as DataSource,
            todayDiff: today.loanFinaleDiffPercent,
            avgDiff: avgLoanFinaleDiff,
            direction: getDirection(today.loanFinaleDiffPercent, avgLoanFinaleDiff),
          },
        ];

        const overallDirection = getDirection(today.totalDiffPercent, avgTotalDiff);

        return {
          today,
          sevenDayAvg,
          trend: overallDirection,
          trendDetails,
        };
      },
    }),
    {
      name: 'pipeline-monitor-storage',
    }
  )
);
