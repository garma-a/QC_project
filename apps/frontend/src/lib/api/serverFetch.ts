import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

/**
 * Try to read the auth_token cookie. Returns null if cookies() is not
 * available (e.g. when called outside a Server Component context in vinext).
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value ?? null;
  } catch {
    return null;
  }
}

export interface ServerFetchOptions extends RequestInit {
  /**
   * When true, a 401 response throws a normal ApiRequestError instead of
   * calling redirect('/login'). Use this for unauthenticated endpoints
   * (login, signup, forgot-password) so their error messages reach the UI.
   */
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

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('>>> serverFetch URL:', url);

  const res = await fetch(url, {
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    // Only auto-redirect on 401 for authenticated endpoints.
    // Auth endpoints (login, signup, forgot-password) pass skipAutoRedirect=true
    // so their "Invalid credentials" / "Email not whitelisted" errors reach the UI
    // instead of being swallowed by Next.js's NEXT_REDIRECT exception.
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

