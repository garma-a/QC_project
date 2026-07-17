'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { QualityControlTestResponseDto } from '@/lib/types/api';

interface UseQcTestsReturn {
  tests: QualityControlTestResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function useQcTests(machineId?: number | null): UseQcTestsReturn {
  const token = useAuthStore((s) => s.accessToken);

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
      return clientFetch<QualityControlTestResponseDto[]>(url, { signal }, token);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
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
