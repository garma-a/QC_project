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
              try {
                const parsed = JSON.parse(msg.data);
                queryClient.setQueryData(['qc-results', lotId], (oldData: any) => {
                  if (!oldData || !oldData.results) return oldData;
                  
                  const newResults = [...oldData.results];
                  
                  if (parsed.type === 'create') {
                    // Only add if it belongs to this lot
                    if (parsed.data.controlLotId === lotId) {
                      newResults.unshift(parsed.data);
                    }
                  } else if (parsed.type === 'update') {
                    const idx = newResults.findIndex((r) => r.id === parsed.data.id);
                    if (idx !== -1) {
                      newResults[idx] = parsed.data;
                    }
                  } else if (parsed.type === 'delete') {
                    const idx = newResults.findIndex((r) => r.id === parsed.data.id);
                    if (idx !== -1) {
                      newResults.splice(idx, 1);
                    }
                  }
                  
                  return { ...oldData, results: newResults };
                });
              } catch (e) {
                queryClient.invalidateQueries({ queryKey: ['qc-results'] });
              }
            }
          },
          onerror(err) {
            if (err instanceof DOMException && err.name === 'AbortError') throw err;
            console.error('SSE Error:', err);
            return 5000; // Retry after 5s
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
