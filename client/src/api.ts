import type { Box, BoxInput, RecommendRequest, RecommendResponse, OrderInput } from '../../shared/types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || 'API 요청 실패');
  }
  return res.json();
}

// 박스 API
export const boxApi = {
  getAll: (includeInactive = true) =>
    request<Box[]>(`/boxes?includeInactive=${includeInactive}`),
  getById: (id: string) => request<Box>(`/boxes/${id}`),
  create: (data: BoxInput) =>
    request<Box>('/boxes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<BoxInput>) =>
    request<Box>(`/boxes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/boxes/${id}`, { method: 'DELETE' }),
};

// 추천 API
export const recommendApi = {
  recommend: (data: RecommendRequest) =>
    request<RecommendResponse>('/recommend', { method: 'POST', body: JSON.stringify(data) }),
};

// 주문 API
export const orderApi = {
  getAll: (params?: { start?: string; end?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.start) qs.set('start', params.start);
    if (params?.end) qs.set('end', params.end);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return request<{ orders: any[]; total: number }>(`/orders?${qs}`);
  },
  create: (data: OrderInput) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),
};

// 분석 API
export const analyticsApi = {
  getUsage: (params?: { start?: string; end?: string }) => {
    const qs = new URLSearchParams();
    if (params?.start) qs.set('start', params.start);
    if (params?.end) qs.set('end', params.end);
    return request<any>(`/analytics/usage?${qs}`);
  },
  getSuggestions: () => request<any>('/analytics/suggest'),
};
