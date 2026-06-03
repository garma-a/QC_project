'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './queryClient';

/**
 * App-wide React Query provider.
 *
 * Uses the shared singleton QueryClient from `queryClient.ts` so that
 * non-React code (like the auth store) can also clear the cache.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use the singleton — stable across renders and not shared between
  // different users' requests in SSR.
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools panel only ships in development bundles */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
