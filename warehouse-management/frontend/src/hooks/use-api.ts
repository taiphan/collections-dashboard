import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaginatedResponse, ApiResponse, CatalogItem, InventoryRecord, WarehouseOperation, ReportData, ReorderAlert } from '@/types';

// Catalog
export function useCatalogItems(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['catalog-items', params],
    queryFn: () => api.get<PaginatedResponse<CatalogItem>>('/catalog-items', params),
  });
}

export function useCatalogItem(id: string) {
  return useQuery({
    queryKey: ['catalog-items', id],
    queryFn: () => api.get<ApiResponse<CatalogItem>>(`/catalog-items/${id}`),
    enabled: !!id,
  });
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CatalogItem>) => api.post('/catalog-items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-items'] }),
  });
}

// Inventory
export function useInventory(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => api.get<PaginatedResponse<InventoryRecord>>('/inventory', params),
    refetchInterval: 5000,
  });
}

// Operations
export function useOperations(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['operations', params],
    queryFn: () => api.get<PaginatedResponse<WarehouseOperation>>('/operations', params),
  });
}

export function useOperation(id: string) {
  return useQuery({
    queryKey: ['operations', id],
    queryFn: () => api.get<ApiResponse<WarehouseOperation>>(`/operations/${id}`),
    enabled: !!id,
  });
}

export function useCreateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/operations/import', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
}

export function useCreateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/operations/export', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
}

export function useApproveOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/operations/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operations'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useRejectOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/operations/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
}

export function useSubmitOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/operations/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
}

// Reports
export function useReport(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => api.get<ApiResponse<ReportData>>('/reports', params),
    enabled: !!params?.periodType,
  });
}

// Analytics
export function useMovingAverages(window: number) {
  return useQuery({
    queryKey: ['analytics', 'moving-averages', window],
    queryFn: () => api.get<ApiResponse<unknown>>('/analytics/moving-averages', { window: String(window) }),
  });
}

export function useTopProducts(days: number) {
  return useQuery({
    queryKey: ['analytics', 'top-products', days],
    queryFn: () => api.get<ApiResponse<unknown>>('/analytics/top-products', { days: String(days) }),
  });
}

export function useReorderAlerts() {
  return useQuery({
    queryKey: ['predictions', 'reorder-alerts'],
    queryFn: () => api.get<ApiResponse<ReorderAlert[]>>('/predictions/reorder-alerts'),
  });
}
