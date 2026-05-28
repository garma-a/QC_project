'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * App-wide React Query provider.
 *
 * Global defaults:
 * - staleTime  30 s  – data is considered fresh for 30 s; no redundant
 *                      network calls when the same query is mounted again.
 * - gcTime      5 min – unused cached entries are kept in memory for 5 min
 *                       so navigating back to a page is instant.
 * - retry       1     – one retry on failure to avoid hammering a broken API.
 * - refetchOnWindowFocus true – picks up changes when user switches back to tab.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create the client inside useState so it is stable across renders and
  // is not shared between different users' requests in SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,        // 30 seconds
            gcTime: 5 * 60 * 1000,       // 5 minutes
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools panel only ships in development bundles */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
