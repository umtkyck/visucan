// ============================================================
// VISUCAN API CLIENT
// HTTP client for backend API calls
// ============================================================

import type { ApiResponse } from '@visucan/types';
import type { ProjectDto, ProjectListDto } from '@/lib/projects';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;

    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'API_ERROR',
            message: 'An error occurred',
          },
        };
      }

      return {
        success: true,
        data: data.data ?? data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            error instanceof Error ? error.message : 'Network error occurred',
        },
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// ============================================================
// API ENDPOINTS
// ============================================================

// Auth
export const authApi = {
  signUp: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  signIn: (data: { email: string; password: string }) =>
    api.post('/auth/signin', data),

  signOut: () => api.post('/auth/signout'),

  refreshToken: () => api.post('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),

  getMe: () => api.get('/auth/me'),
};

// Projects
export const projectsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ProjectListDto>('/projects', { params }),

  get: (id: string) => api.get<ProjectDto>(`/projects/${id}`),

  create: (data: {
    name: string;
    description?: string;
    boardWidth?: number;
    boardHeight?: number;
    layerCount?: number;
  }) => api.post<ProjectDto>('/projects', data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      status: string;
      boardWidth: number;
      boardHeight: number;
      layerCount: number;
    }>
  ) => api.patch<ProjectDto>(`/projects/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),

  duplicate: (id: string) => api.post<ProjectDto>(`/projects/${id}/duplicate`),
};

// Components (DigiKey)
export const componentsApi = {
  search: (query: string, params?: { category?: string; limit?: number }) =>
    api.get('/components/search', { params: { query, ...params } }),

  get: (partNumber: string) => api.get(`/components/${partNumber}`),

  compare: (partNumbers: string[]) =>
    api.post('/components/compare', { partNumbers }),
};

// Quotes (PCBWAY)
export const quotesApi = {
  confirm: (projectId: string) =>
    api.post(`/projects/${projectId}/confirm`),

  getQuote: (confirmationId: string, quantity: number) =>
    api.post(`/quotes`, { confirmationId, quantity }),

  list: (params?: { page?: number; limit?: number }) =>
    api.get('/quotes', { params }),

  get: (id: string) => api.get(`/quotes/${id}`),
};

// Orders
export const ordersApi = {
  create: (quoteId: string, shippingAddress: unknown) =>
    api.post('/orders', { quoteId, shippingAddress }),

  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),

  get: (id: string) => api.get(`/orders/${id}`),
};

// Shipping (North American carriers: UPS, FedEx, USPS)
export const shippingApi = {
  carriers: () =>
    api.get<{
      carriers: Array<{ id: string; name: string; country: string; configured: boolean }>;
    }>('/shipping/carriers'),

  track: (number: string, carrier?: 'ups' | 'fedex' | 'usps') =>
    api.get<TrackingResultDto>('/shipping/track', { params: { number, carrier } }),
};

export interface TrackingEventDto {
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
}

export interface TrackingResultDto {
  carrier: 'ups' | 'fedex' | 'usps';
  carrierName: string;
  trackingNumber: string;
  status: string;
  statusDescription: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  events: TrackingEventDto[];
  live: boolean;
  note?: string;
}

// Marketplace
export const marketplaceApi = {
  listings: {
    list: (params?: { category?: string; page?: number; limit?: number }) =>
      api.get('/marketplace', { params }),

    get: (id: string) => api.get(`/marketplace/${id}`),

    create: (data: unknown) => api.post('/marketplace', data),

    update: (id: string, data: unknown) => api.patch(`/marketplace/${id}`, data),

    delete: (id: string) => api.delete(`/marketplace/${id}`),

    purchase: (id: string, data: { quantity: number; shippingAddress: unknown }) =>
      api.post(`/marketplace/${id}/purchase`, data),
  },

  seller: {
    dashboard: () => api.get('/seller/dashboard'),

    listings: () => api.get('/seller/listings'),

    orders: () => api.get('/seller/orders'),

    shipOrder: (orderId: string, trackingNumber: string, carrier: string) =>
      api.put(`/seller/orders/${orderId}/ship`, { trackingNumber, carrier }),

    analytics: () => api.get('/seller/analytics'),

    payouts: () => api.get('/seller/payouts'),

    requestPayout: () => api.post('/seller/payouts/request'),
  },
};

// AI Chat
export const chatApi = {
  send: (projectId: string, message: string) =>
    api.post(`/projects/${projectId}/chat`, { message }),

  history: (projectId: string) =>
    api.get(`/projects/${projectId}/chat`),
};

// Logo
export const logoApi = {
  upload: (projectId: string, formData: FormData) =>
    fetch(`${API_BASE_URL}/projects/${projectId}/logo`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json()),

  get: (projectId: string) => api.get(`/projects/${projectId}/logo`),

  update: (projectId: string, data: unknown) =>
    api.put(`/projects/${projectId}/logo`, data),

  delete: (projectId: string) => api.delete(`/projects/${projectId}/logo`),
};

// Export
export const exportApi = {
  gerber: (projectId: string) =>
    fetch(`${API_BASE_URL}/projects/${projectId}/export/gerber`),

  bom: (projectId: string, format: 'csv' | 'xlsx' = 'csv') =>
    fetch(`${API_BASE_URL}/projects/${projectId}/export/bom?format=${format}`),

  report: (projectId: string, type: string) =>
    api.post(`/projects/${projectId}/reports`, { type }),

  listReports: (projectId: string) =>
    api.get(`/projects/${projectId}/reports`),
};

export default api;
