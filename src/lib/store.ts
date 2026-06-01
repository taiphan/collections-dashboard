import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CollectionRecord,
  BucketName,
  BUCKET_NAMES,
  BUCKET_LABELS,
  DashboardStats,
  BucketSummary,
} from './types';

interface CollectionsState {
  records: CollectionRecord[];
  addRecords: (records: CollectionRecord[]) => void;
  updateRecord: (id: string, updates: Partial<CollectionRecord>) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
  getStats: () => DashboardStats;
  getRecordsByBucket: (bucket: BucketName) => CollectionRecord[];
  getFilteredRecords: (filters: RecordFilters) => CollectionRecord[];
}

export interface RecordFilters {
  bucket?: BucketName | 'all';
  status?: CollectionRecord['status'] | 'all';
  search?: string;
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecords: (newRecords) =>
        set((state) => ({
          records: [...state.records, ...newRecords],
        })),

      updateRecord: (id, updates) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id ? { ...record, ...updates } : record
          ),
        })),

      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        })),

      clearAllRecords: () => set({ records: [] }),

      getStats: () => {
        const { records } = get();

        const bucketSummaries: BucketSummary[] = BUCKET_NAMES.map((bucket) => {
          const bucketRecords = records.filter((r) => r.bucket === bucket);
          const totalAmount = bucketRecords.reduce(
            (sum, r) => sum + r.outstandingAmount,
            0
          );
          const paidAmount = bucketRecords
            .filter((r) => r.status === 'paid')
            .reduce((sum, r) => sum + r.outstandingAmount, 0);

          return {
            bucket,
            label: BUCKET_LABELS[bucket],
            totalAccounts: bucketRecords.length,
            totalAmount,
            paidAmount,
            collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
          };
        });

        const totalOutstanding = records.reduce(
          (sum, r) => sum + r.outstandingAmount,
          0
        );
        const totalCollected = records
          .filter((r) => r.status === 'paid')
          .reduce((sum, r) => sum + r.outstandingAmount, 0);

        return {
          totalOutstanding,
          totalAccounts: records.length,
          totalCollected,
          overallCollectionRate:
            totalOutstanding > 0 ? (totalCollected / totalOutstanding) * 100 : 0,
          bucketSummaries,
        };
      },

      getRecordsByBucket: (bucket) => {
        return get().records.filter((r) => r.bucket === bucket);
      },

      getFilteredRecords: (filters) => {
        let filtered = get().records;

        if (filters.bucket && filters.bucket !== 'all') {
          filtered = filtered.filter((r) => r.bucket === filters.bucket);
        }

        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter((r) => r.status === filters.status);
        }

        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.customerName.toLowerCase().includes(search) ||
              r.accountId.toLowerCase().includes(search)
          );
        }

        return filtered;
      },
    }),
    {
      name: 'collection-portal-storage',
    }
  )
);
