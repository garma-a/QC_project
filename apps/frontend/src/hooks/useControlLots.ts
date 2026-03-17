'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { ControlLotResponseDto } from '@/lib/types/api';

interface UseControlLotsReturn {
  lots: ControlLotResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useControlLots(): UseControlLotsReturn {
  const [lots, setLots] = useState<ControlLotResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  const fetchLots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientFetch<ControlLotResponseDto[]>('/api/v1/control-lots', {}, token);
      setLots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch control lots');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  return { lots, loading, error, refetch: fetchLots };
}
