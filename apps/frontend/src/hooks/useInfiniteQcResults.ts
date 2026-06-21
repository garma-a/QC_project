import { useInfiniteQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { EnrichedQcResultResponseDto } from '@/lib/types/api';
import { MonitorResultEntry } from './useDashboardData';

/**
 * Infinite-scroll QC results for the /qc page.
 *
 * SCALABLE DESIGN:
 * - Results are fetched 50 at a time with infinite scroll.
 * - Each result page is already enriched by the backend with lot/test/machine context
 *   via SQL JOINs, so no separate /qc-tests or /control-lots call is needed here.
 * - The old approach fetched ALL lots (4042) and tests (6129) just to join them
 *   client-side — this hook now has zero context prefetch overhead.
 * - For 100K+ results, the infinite scroll loads 50 rows at a time — the network
 *   only ever transfers what the user has scrolled to.
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
      const url = `/api/v1/qc-results?limit=${limit}&offset=${offset}${machineId ? `&machineId=${machineId}` : ''}`;
      
      const res = await clientFetch<{ results: EnrichedQcResultResponseDto[] }>(
        url,
        { signal },
        token,
      );

      return {
        results: Array.isArray(res?.results) ? res.results : [],
        nextOffset: (res?.results?.length ?? 0) === limit ? offset + limit : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!token && machineId !== undefined, // Only fetch when a machine is selected
  });

  // Map enriched results directly to MonitorResultEntry — no cross-referencing needed
  const qcHistory: MonitorResultEntry[] = [];

  if (data) {
    const allResults = data.pages.flatMap((page) => page.results);

    for (const result of allResults) {
      const dateObj = new Date(result.testDate as string);
      const dateStr = !Number.isNaN(dateObj.getTime())
        ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'N/A N/A';

      qcHistory.push({
        ...result,
        level: result.lotLevel ?? 1,
        lotMean: result.lotMean ?? 0,
        lotSd: result.lotSd ?? 1,
        expectedRange: `${result.lowerControlLimit ?? 0} - ${result.upperControlLimit ?? 0}`,
        date: dateStr,
      });
    }
  }

  return {
    qcHistory,
    isLoading: isLoading || !token,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: token ? error?.message || null : null,
  };
}
