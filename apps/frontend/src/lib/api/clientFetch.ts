/**
 * Client-side API helper for data-fetching hooks.
 * Uses the JWT token from the auth store to make authenticated requests.
 * Server components should use `serverFetch.ts` instead.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ClientApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ClientApiError';
    this.statusCode = statusCode;
  }
}

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
      // Token expired or invalid — clear auth and redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    throw new ClientApiError(res.status, errorMessage);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}
