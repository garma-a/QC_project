import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient instance.
 *
 * Exported so that non-React code (e.g. the auth store's `clearAuth` action)
 * can call `queryClient.clear()` on logout without needing a React context.
 *
 * Global defaults:
 * - staleTime  30 s  – data is considered fresh for 30 s; no redundant
 *                      network calls when the same query is mounted again.
 * - gcTime      5 min – unused cached entries are kept in memory for 5 min
 *                       so navigating back to a page is instant.
 * - retry       1     – one retry on failure to avoid hammering a broken API.
 * - refetchOnWindowFocus true – picks up changes when user switches back to tab.
 */
let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,        // 30 seconds
          gcTime: 5 * 60 * 1000,       // 5 minutes
          retry: 1,
          refetchOnWindowFocus: true,
        },
      },
    });
  }
  return queryClientInstance;
}
