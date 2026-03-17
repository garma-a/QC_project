import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
  });

  if (!res.ok) {
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
      // Could not parse error body
    }

    throw new ApiRequestError(res.status, errorMessage, details);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    serverFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    serverFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    serverFetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    serverFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    serverFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
