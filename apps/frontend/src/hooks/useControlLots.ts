'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { ControlLotResponseDto } from '@/lib/types/api';

interface UseControlLotsReturn {
  lots: ControlLotResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useControlLots(): UseControlLotsReturn {
  const token = useAuthStore((s) => s.accessToken);

  // Cached for 30 s (global staleTime default in QueryProvider).
  // AbortSignal forwarded automatically — stale requests are cancelled.
  const {
    data: lots = [],
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['control-lots', token],
    queryFn: ({ signal }) =>
      clientFetch<ControlLotResponseDto[]>('/api/v1/control-lots', { signal }, token),
    enabled: !!token,
  });

  return {
    lots,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch control lots') : null,
    refetch,
  };
}
