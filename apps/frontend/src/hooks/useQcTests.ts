'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch, API_BASE_URL } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { QcTestResponseDto } from '@/lib/types/api';

interface UseQcTestsReturn {
  tests: QcTestResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

/**
 * Fetch all QC tests configured on a specific machine.
 *
 * The machineId is part of the query key, so React Query caches results
 * per-machine. When the user switches machines quickly, in-flight requests
 * for the previous machine are cancelled via AbortSignal, preventing the
 * race condition where a slow response from machine A could overwrite the
 * correct data for machine B.
 */
export function useQcTests(machineId?: number | null): UseQcTestsReturn {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const connectSse = async () => {
      try {
        await fetchEventSource(`${API_BASE_URL}/api/v1/qc-tests/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          onmessage(msg) {
            if (!msg.event || msg.event === 'message') {
              queryClient.invalidateQueries({ queryKey: ['qc-tests'] });
            }
          },
          onerror(err) {
            throw err;
          }
        });
      } catch (err) {
        // Silently ignore connection errors
      }
    };

    connectSse();

    return () => {
      controller.abort();
    };
  }, [token, queryClient]);

  const {
    data,
    isLoading,
    isError,
    error: rawError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['qc-tests', machineId],
    queryFn: ({ pageParam = 0, signal }) => {
      const url = machineId != null
        ? `/api/v1/qc-tests/machine/${machineId}?limit=50&offset=${pageParam}`
        : `/api/v1/qc-tests?limit=50&offset=${pageParam}`;
      return clientFetch<QcTestResponseDto[]>(url, { signal }, token);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    // Do not fire the request if machineId is exactly null (which means it's waiting for selection).
    // If it's undefined, it means we want ALL tests.
    enabled: machineId !== null && !!token,
  });

  const tests = data?.pages.flat() || [];

  return {
    tests,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch QC tests') : null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
