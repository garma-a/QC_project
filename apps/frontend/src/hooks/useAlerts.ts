'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  AlertResponseDto,
  ResolveAlertDto,
  UserAlertStatusResponseDto,
} from '@/lib/types/api';

interface UseAlertsReturn {
  alerts: AlertResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  markSeen: (alertId: number) => Promise<UserAlertStatusResponseDto[]>;
  markResolved: (
    alertId: number,
    payload?: ResolveAlertDto,
  ) => Promise<UserAlertStatusResponseDto[]>;
}

export interface UseAlertsParams {
  pollIntervalMs?: number;
  scope?: 'assigned' | 'all';
  sectionId?: number | null;
  machineId?: number | null;
}

export function useAlerts({ pollIntervalMs, scope = 'assigned', sectionId, machineId }: UseAlertsParams = {}): UseAlertsReturn {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

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
    queryKey: ['alerts', scope, sectionId, machineId],
    queryFn: async ({ pageParam = 0, signal }) => {
      let url = `/api/v1/alerts?limit=50&offset=${pageParam}&scope=${scope}`;
      if (sectionId) url += `&sectionId=${sectionId}`;
      if (machineId) url += `&machineId=${machineId}`;
      return clientFetch<AlertResponseDto[]>(url, { signal }, token);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    enabled: !!token,
    refetchInterval: pollIntervalMs && pollIntervalMs > 0 ? pollIntervalMs : false,
  });

  const alerts = data?.pages.flat() || [];

  const { mutateAsync: markSeen } = useMutation({
    mutationFn: (alertId: number) =>
      clientFetch<UserAlertStatusResponseDto[]>(
        `/api/v1/alerts/mark-seen/${alertId}`,
        { method: 'PATCH' },
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const { mutateAsync: markResolved } = useMutation({
    mutationFn: ({ alertId, payload }: { alertId: number; payload?: ResolveAlertDto }) =>
      clientFetch<UserAlertStatusResponseDto[]>(
        `/api/v1/alerts/mark-resolved/${alertId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload ?? {}),
        },
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  return {
    alerts,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch alerts') : null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markSeen,
    markResolved: (alertId, payload) => markResolved({ alertId, payload }),
  };
}
