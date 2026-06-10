import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  ControlLotResponseDto,
  QcResultResponseDto,
  QcTestResponseDto,
} from '@/lib/types/api';
import { MonitorResultEntry } from './useDashboardData';

export function useInfiniteQcResults() {
  const token = useAuthStore((s) => s.accessToken);

  const { data: contextData } = useQuery({
    queryKey: ['qc-context-data'],
    queryFn: async ({ signal }) => {
      const [allLots, allTests] = await Promise.all([
        clientFetch<ControlLotResponseDto[]>('/api/v1/control-lots', { signal }, token).catch(() => []),
        clientFetch<QcTestResponseDto[]>('/api/v1/qc-tests', { signal }, token).catch(() => []),
      ]);

      const testById = new Map<number, QcTestResponseDto>();
      for (const test of allTests) {
        testById.set(test.id, test);
      }

      const lotsWithContext = allLots
        .map((lot) => {
          const test = testById.get(lot.testId);
          return test ? { lot, machineId: test.machineId, test } : null;
        })
        .filter((item): item is { lot: ControlLotResponseDto; machineId: number; test: QcTestResponseDto } => item !== null);

      return { lotsWithContext };
    },
    enabled: !!token,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['qc-results-infinite'],
    queryFn: async ({ pageParam = 0, signal }) => {
      const limit = 50;
      const offset = pageParam;
      const res = await clientFetch<{ results: QcResultResponseDto[] }>(`/api/v1/qc-results?limit=${limit}&offset=${offset}`, { signal }, token);

      return {
        results: Array.isArray(res?.results) ? res.results : [],
        nextOffset: (res?.results?.length ?? 0) === limit ? offset + limit : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!token && !!contextData,
  });

  const qcHistory: MonitorResultEntry[] = [];

  if (data && contextData) {
    const allResults = data.pages.flatMap((page) => page.results);

    for (const result of allResults) {
      const ctx = contextData.lotsWithContext.find((c) => c.lot.id === result.lotId);
      if (!ctx) continue;

      const dateObj = new Date(result.testDate);
      const dateStr = !Number.isNaN(dateObj.getTime())
        ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'N/A N/A';

      qcHistory.push({
        ...result,
        machineId: ctx.machineId,
        testId: ctx.test.id,
        testName: ctx.test.testName,
        lotId: ctx.lot.id,
        level: ctx.lot.level ?? 1,
        lotNumber: ctx.lot.lotNumber,
        lotMean: ctx.lot.mean ?? 0,
        lotSd: ctx.lot.standardDeviation ?? 1,
        expectedRange: `${ctx.lot.lowerControlLimit ?? 0} - ${ctx.lot.upperControlLimit ?? 0}`,
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
