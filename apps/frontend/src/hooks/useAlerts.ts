'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { AlertResponseDto } from '@/lib/types/api';

interface UseAlertsReturn {
  alerts: AlertResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Placeholder hook for fetching alerts.
 * The alerts endpoint does not exist in the Swagger spec yet,
 * so this will gracefully fail with an empty array.
 * 
 * Includes polling support — set `pollIntervalMs` to enable
 * automatic refetching (default: disabled).
 */
export function useAlerts(pollIntervalMs?: number): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientFetch<AlertResponseDto[]>('/api/v1/alerts', {}, token);
      setAlerts(data);
    } catch (err) {
      // Silently handle 404 since endpoint may not exist yet
      if (err instanceof Error && err.message.includes('404')) {
        setAlerts([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlerts();

    if (pollIntervalMs && pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchAlerts, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAlerts, pollIntervalMs]);

  return { alerts, loading, error, refetch: fetchAlerts };
}
