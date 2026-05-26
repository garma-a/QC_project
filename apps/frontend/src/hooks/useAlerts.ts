'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  refetch: () => Promise<void>;
  markSeen: (alertId: number) => Promise<UserAlertStatusResponseDto[]>;
  markResolved: (
    alertId: number,
    payload?: ResolveAlertDto,
  ) => Promise<UserAlertStatusResponseDto[]>;
}

export function useAlerts(pollIntervalMs?: number): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async (background = false) => {
    if (!background) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await clientFetch<AlertResponseDto[]>('/api/v1/alerts', {}, token);
      setAlerts((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          return prev;
        }
        return data;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [token]);

  const markSeen = useCallback(
    async (alertId: number) => {
      const updated = await clientFetch<UserAlertStatusResponseDto[]>(
        `/api/v1/alerts/mark-seen/${alertId}`,
        { method: 'PATCH' },
        token,
      );
      await fetchAlerts(true);
      return updated;
    },
    [fetchAlerts, token],
  );

  const markResolved = useCallback(
    async (alertId: number, payload?: ResolveAlertDto) => {
      const updated = await clientFetch<UserAlertStatusResponseDto[]>(
        `/api/v1/alerts/mark-resolved/${alertId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload ?? {}),
        },
        token,
      );
      await fetchAlerts(true);
      return updated;
    },
    [fetchAlerts, token],
  );

  useEffect(() => {
    fetchAlerts(false);

    if (pollIntervalMs && pollIntervalMs > 0) {
      intervalRef.current = setInterval(() => fetchAlerts(true), pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAlerts, pollIntervalMs]);

  return {
    alerts,
    loading,
    error,
    refetch: () => fetchAlerts(false),
    markSeen,
    markResolved,
  };
}
