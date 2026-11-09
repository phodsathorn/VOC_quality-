/**
 * Centralized API Client with Auth Token Injection & Error Normalization
 */
import { API } from '../config';

const DEFAULT_TIMEOUT_MS = 10000;

function getAuthHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('voc_auth_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function apiFetch(endpoint, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    headers: customHeaders = {},
    params,
    ...fetchOptions
  } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = getAuthHeaders(customHeaders);
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = (isJson && data?.detail) ? data.detail : res.statusText || 'API Error';
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) =>
    apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options = {}) =>
    apiFetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options = {}) =>
    apiFetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options = {}) => apiFetch(endpoint, { method: 'DELETE', ...options }),
};

export default apiClient;

