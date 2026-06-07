'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch, API_BASE_URL } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { QcResultsWithLotResponseDto } from '@/lib/types/api';

interface UseQcResultsReturn {
  data: QcResultsWithLotResponseDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch all QC results for a specific control lot.
 * Returns the lot summary + array of results (for Levey-Jennings chart).
 *
 * The lotId is included in the query key, so React Query maintains a
 * separate cache entry per lot. When the user switches lots rapidly,
 * in-flight requests for the previous lot are automatically cancelled via
 * AbortSignal — the most critical race condition in the app.
 */
export function useQcResults(lotId: number | null): UseQcResultsReturn {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const {
    data = null,
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['qc-results', lotId],
    queryFn: ({ signal }) =>
      clientFetch<QcResultsWithLotResponseDto>(
        `/api/v1/qc-results?lotId=${lotId}`,
        { signal },
        token,
      ),
    // Do not fire the request at all when no lot is selected.
    // This also resets the loading/error states cleanly.
    enabled: lotId !== null && !!token,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const connectSse = async () => {
      try {
        await fetchEventSource(`${API_BASE_URL}/api/v1/qc-results/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          onmessage(msg) {
            if (!msg.event || msg.event === 'message') {
              // Invalidate qc-results queries when a new result arrives
              queryClient.invalidateQueries({ queryKey: ['qc-results'] });
            }
          },
          onerror(err) {
            throw err;
          }
        });
      } catch (err) {}
    };

    connectSse();

    return () => {
      controller.abort();
    };
  }, [token, queryClient]);

  return {
    data,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch QC results') : null,
    refetch,
  };
}
