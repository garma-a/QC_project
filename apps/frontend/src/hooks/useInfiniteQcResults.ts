import { useInfiniteQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';

export interface QcInteractiveHistoryEntryDto {
  id: string;
  machineId: string;
  testName: string;
  date: string;
  rawDate: string;
  performedBy: string;
  numericResult: number;
  result: string;
  expectedRange: string;
  status: string;
  notes: string;
  zScore: number;
  violatedRule: string;
  lotMean: number;
  lotSd: number;
}

/**
 * Infinite-scroll QC results for the /qc page using BFF.
 * The NestJS Backend already completely formats the date, calculates the expected range,
 * and handles missing data fallbacks, returning a pristine array.
 */
export function useInfiniteQcResults(machineId?: number) {
  const token = useAuthStore((s) => s.accessToken);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['qc-results-infinite', machineId],
    queryFn: async ({ pageParam = 0, signal }) => {
      const limit = 50;
      const offset = pageParam as number;
      const url = `/api/v1/bff/qc/history?limit=${limit}&offset=${offset}${machineId ? `&machineId=${machineId}` : ''}`;
      
      const res = await clientFetch<{ results: QcInteractiveHistoryEntryDto[], nextOffset?: number }>(
        url,
        { signal },
        token,
      );

      return {
        results: Array.isArray(res?.results) ? res.results : [],
        nextOffset: res?.nextOffset,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!token && machineId !== undefined, // Only fetch when a machine is selected
  });

  // Since BFF formats exactly what the component needs, we just flatten the pages
  const qcHistory: QcInteractiveHistoryEntryDto[] = data ? data.pages.flatMap((page) => page.results) : [];

  return {
    qcHistory,
    isLoading: isLoading || !token,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: token ? error?.message || null : null,
  };
}
