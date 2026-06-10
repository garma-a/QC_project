'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { MachineResponseDto } from '@/lib/types/api';

interface UseMachinesReturn {
  machines: MachineResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function useMachines(): UseMachinesReturn {
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
    queryKey: ['machines'],
    queryFn: ({ pageParam = 0, signal }) =>
      clientFetch<MachineResponseDto[]>(`/api/v1/machines?limit=50&offset=${pageParam}`, { signal }, token),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    enabled: !!token,
  });

  const machines = data?.pages.flat() || [];

  return {
    machines,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch machines') : null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
