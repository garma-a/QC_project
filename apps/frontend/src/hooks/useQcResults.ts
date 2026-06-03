'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
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

  return {
    data,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch QC results') : null,
    refetch,
  };
}
