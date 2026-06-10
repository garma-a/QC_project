'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { ControlLotResponseDto } from '@/lib/types/api';

interface UseControlLotsReturn {
  lots: ControlLotResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function useControlLots(): UseControlLotsReturn {
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
    queryKey: ['control-lots'],
    queryFn: ({ pageParam = 0, signal }) =>
      clientFetch<ControlLotResponseDto[]>(`/api/v1/control-lots?limit=50&offset=${pageParam}`, { signal }, token),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    enabled: !!token,
  });

  const lots = data?.pages.flat() || [];

  return {
    lots,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch control lots') : null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
