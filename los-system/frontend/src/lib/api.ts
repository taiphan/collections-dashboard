import type { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        response.status,
        data.error?.code,
      );
    }

    return data;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    return this.request<T>(url);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();

// Typed API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: unknown }>>(
      '/auth/login',
      { email, password },
    ),
  me: () => api.get<ApiResponse<unknown>>('/auth/me'),
};

export const casesApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<unknown>>('/cases', params),
  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/cases/${id}`),
  dashboard: () =>
    api.get<ApiResponse<unknown>>('/cases/dashboard'),
  transition: (id: string, toStage: string, reason?: string) =>
    api.post<ApiResponse<unknown>>(`/cases/${id}/transition`, { toStage, reason }),
  assign: (id: string, userId: string) =>
    api.post<ApiResponse<unknown>>(`/cases/${id}/assign`, { userId }),
};

export const applicationsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<unknown>>('/applications', params),
  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/applications/${id}`),
  create: (data: unknown) =>
    api.post<ApiResponse<{ id: string }>>('/applications', data),
  submit: (id: string) =>
    api.post<ApiResponse<unknown>>(`/applications/${id}/submit`),
};

export const customersApi = {
  search: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<unknown>>('/customers', params),
  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/customers/${id}`),
  create: (data: unknown) =>
    api.post<ApiResponse<{ id: string }>>('/customers', data),
};
