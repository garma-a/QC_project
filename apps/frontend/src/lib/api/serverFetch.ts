import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  mockMachines,
  mockProfile,
  mockSections,
  mockQcTests,
  mockControlLots,
  mockAlerts,
  mockDashboard,
  mockMachineHistory,
  mockQcHistory,
  mockQcMachines
} from '@/data/mocks';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export class ApiRequestError extends Error {
  public statusCode: number;
  public details: string[];

  constructor(statusCode: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value ?? null;
  } catch {
    return null;
  }
}

export interface ServerFetchOptions extends RequestInit {
  skipAutoRedirect?: boolean;
}

export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { skipAutoRedirect, ...fetchOptions } = options;
  const token = await getAuthToken();

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    // Provide mock data directly to avoid self-fetch network timeouts on Vercel
    const method = fetchOptions.method || 'GET';
    
    if (method === 'GET') {
      if (endpoint.startsWith('/api/v1/users/me/profile')) return mockProfile as unknown as T;
      if (endpoint.startsWith('/api/v1/sections')) return mockSections as unknown as T;
      if (endpoint.startsWith('/api/v1/machines')) return mockMachines as unknown as T;
      if (endpoint.startsWith('/api/v1/qc-tests')) return mockQcTests as unknown as T;
      if (endpoint.startsWith('/api/v1/control-lots')) return mockControlLots as unknown as T;
      if (endpoint.startsWith('/api/v1/alerts')) return mockAlerts as unknown as T;
      if (endpoint.startsWith('/api/v1/bff/dashboard/machine-history')) return mockMachineHistory as unknown as T;
      if (endpoint.startsWith('/api/v1/bff/dashboard')) return mockDashboard as unknown as T;
      if (endpoint.startsWith('/api/v1/bff/qc/history')) return mockQcHistory as unknown as T;
      if (endpoint.startsWith('/api/v1/bff/qc/machines')) return mockQcMachines as unknown as T;
    }
    
    if (method === 'POST') {
      if (endpoint.startsWith('/api/v1/auth/login') || endpoint.startsWith('/api/v1/auth/refresh')) {
        const mockPayload = {
          userId: 1,
          role: 'ADMIN',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600 * 24
        };
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
        const mockJwt = `${header}.${payload}.mock_signature`;
        return { accessToken: mockJwt, refreshToken: mockJwt } as unknown as T;
      }
      return { message: 'Mock POST success', id: Date.now() } as unknown as T;
    }
    
    if (method === 'PATCH' || method === 'DELETE') {
      return { message: `Mock ${method} success` } as unknown as T;
    }
    
    throw new ApiRequestError(404, 'Mock endpoint not configured', []);
  }

  // Hit the backend directly
  const url = `${backendUrl}${endpoint}`;
  
  const res = await fetch(url, {
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && !skipAutoRedirect) {
      redirect('/login');
    }

    let errorMessage = `HTTP error! status: ${res.status}`;
    let details: string[] = [];

    try {
      const errorData: ApiError = await res.json();
      if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(', ');
        details = errorData.message;
      } else {
        errorMessage = errorData.message || errorMessage;
      }
    } catch {
      // Ignore
    }

    throw new ApiRequestError(res.status, errorMessage, details);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: ServerFetchOptions) =>
    serverFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data: unknown, options?: ServerFetchOptions) =>
    serverFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown, options?: ServerFetchOptions) =>
    serverFetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown, options?: ServerFetchOptions) =>
    serverFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, data?: unknown, options?: ServerFetchOptions) =>
    serverFetch<T>(endpoint, { ...options, method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
};

