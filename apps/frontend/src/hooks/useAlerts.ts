'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientFetch, API_BASE_URL } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
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

export function useAlerts(pollIntervalMs?: number): UseAlertsReturn {
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
    queryKey: ['alerts'],
    queryFn: async ({ pageParam = 0, signal }) =>
      clientFetch<AlertResponseDto[]>(`/api/v1/alerts?limit=50&offset=${pageParam}`, { signal }, token),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    enabled: !!token,
    refetchInterval: pollIntervalMs && pollIntervalMs > 0 ? pollIntervalMs : false,
  });

  const alerts = data?.pages.flat() || [];

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const connectSse = async () => {
      try {
        await fetchEventSource(`${API_BASE_URL}/api/v1/alerts/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          onmessage(msg) {
            if (!msg.event || msg.event === 'message') {
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
            }
          },
          onerror(err) {
            // Rethrowing here tells fetchEventSource to attempt reconnect
            throw err;
          }
        });
      } catch (err) {
        // SSE connection will automatically retry, we can silently catch here to avoid unhandled rejections
      }
    };

    connectSse();

    return () => {
      controller.abort();
    };
  }, [token, queryClient]);

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
