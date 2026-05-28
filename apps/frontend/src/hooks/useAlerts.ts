'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  markSeen: (alertId: number) => Promise<UserAlertStatusResponseDto[]>;
  markResolved: (
    alertId: number,
    payload?: ResolveAlertDto,
  ) => Promise<UserAlertStatusResponseDto[]>;
}

export function useAlerts(pollIntervalMs?: number): UseAlertsReturn {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  // ── Main query ──────────────────────────────────────────────────────────────
  // React Query differentiates `isLoading` (first fetch, no cached data) from
  // `isFetching` (background refetch). This eliminates the loading-flash bug
  // that the background-flag workaround was solving.
  // The AbortSignal is forwarded by React Query so in-flight requests are
  // automatically cancelled on unmount or when a newer request supersedes them.
  const {
    data: alerts = [],
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['alerts', token],
    queryFn: async ({ signal }) =>
      clientFetch<AlertResponseDto[]>('/api/v1/alerts', { signal }, token),
    // Poll in the background. React Query keeps showing the previous (cached)
    // data while the background fetch is in progress — no visible flash.
    refetchInterval: pollIntervalMs && pollIntervalMs > 0 ? pollIntervalMs : false,
    // Disable the query entirely when there is no auth token
    enabled: !!token,
  });

  // ── markSeen mutation ───────────────────────────────────────────────────────
  const { mutateAsync: markSeen } = useMutation({
    mutationFn: (alertId: number) =>
      clientFetch<UserAlertStatusResponseDto[]>(
        `/api/v1/alerts/mark-seen/${alertId}`,
        { method: 'PATCH' },
        token,
      ),
    // After a successful mutation, invalidate the cache so the list refreshes
    // with accurate statuses. No manual fetch call needed.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // ── markResolved mutation ───────────────────────────────────────────────────
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
    // Flatten the tuple signature to match the original hook's interface
    markSeen,
    markResolved: (alertId, payload) => markResolved({ alertId, payload }),
  };
}
