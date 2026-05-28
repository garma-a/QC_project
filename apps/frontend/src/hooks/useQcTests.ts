'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { QcTestResponseDto } from '@/lib/types/api';

interface UseQcTestsReturn {
  tests: QcTestResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
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
export function useQcTests(machineId: number | null): UseQcTestsReturn {
  const token = useAuthStore((s) => s.accessToken);

  const {
    data: tests = [],
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['qc-tests', machineId, token],
    queryFn: ({ signal }) =>
      clientFetch<QcTestResponseDto[]>(
        `/api/v1/qc-tests/machine/${machineId}`,
        { signal },
        token,
      ),
    // Do not fire the request at all when no machine is selected.
    enabled: machineId !== null && !!token,
  });

  return {
    tests,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch QC tests') : null,
    refetch,
  };
}
