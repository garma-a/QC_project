import { logoutAccount, refreshTokensAction } from '../actions';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Client-side API helper for data-fetching hooks.
 * Uses the JWT token from the auth store to make authenticated requests.
 * Server components should use `serverFetch.ts` instead.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ClientApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ClientApiError';
    this.statusCode = statusCode;
  }
}

// Mutex to prevent multiple parallel refresh requests
let refreshPromise: Promise<string | null> | null = null;

export async function clientFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      // Forward any AbortSignal supplied by React Query / useEffect cleanup
      signal: options.signal,
    });
  } catch (err) {
    // Re-throw AbortError as-is so React Query can detect and discard it
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw err;
  }

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errorMessage = Array.isArray(body.message) ? body.message.join(', ') : body.message || errorMessage;
    } catch { /* ignore parse errors */ }

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        try {
          if (!refreshPromise) {
            refreshPromise = refreshTokensAction().then((result) => {
              if (result.success && result.token) {
                return result.token;
              }
              return null;
            }).catch(() => null)
              .finally(() => {
                refreshPromise = null;
              });
          }

          const newToken = await refreshPromise;

          if (newToken) {
            // Update token in Zustand
            const authState = useAuthStore.getState();
            if (authState.currentUser) {
              authState.setAuth(authState.currentUser, newToken);
            }

            // Retry original request with new token
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryRes = await fetch(url, {
              ...options,
              headers,
              signal: options.signal,
            });

            if (retryRes.ok) {
              if (retryRes.status === 204) return {} as T;
              return retryRes.json() as Promise<T>;
            }
          }
        } catch (e) {
          // Fall through to logout
        }

        // Refresh failed, clear cookies via server action FIRST
        try {
          await logoutAccount();
        } catch (e) {
          // Ignore logout errors
        }
        // Now clear the Zustand store
        useAuthStore.getState().clearAuth();
        window.location.href = '/login?force=true';
      }
    }

    throw new ClientApiError(res.status, errorMessage);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}
