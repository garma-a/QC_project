'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { MachineResponseDto } from '@/lib/types/api';

interface UseMachinesReturn {
  machines: MachineResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMachines(): UseMachinesReturn {
  const token = useAuthStore((s) => s.accessToken);

  // The AbortSignal is forwarded by React Query so stale requests (e.g. fired
  // while the token was changing) are automatically cancelled before the new
  // request starts — eliminating the race condition.
  const {
    data: machines = [],
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['machines', token],
    queryFn: ({ signal }) =>
      clientFetch<MachineResponseDto[]>('/api/v1/machines', { signal }, token),
    enabled: !!token,
  });

  return {
    machines,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch machines') : null,
    refetch,
  };
}
