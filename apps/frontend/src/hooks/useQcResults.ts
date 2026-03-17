'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { QcResultsWithLotResponseDto } from '@/lib/types/api';

interface UseQcResultsReturn {
  data: QcResultsWithLotResponseDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch all QC results for a specific control lot.
 * Returns the lot summary + array of results (for Levey-Jennings chart).
 */
export function useQcResults(lotId: number | null): UseQcResultsReturn {
  const [data, setData] = useState<QcResultsWithLotResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  const fetchResults = useCallback(async () => {
    if (lotId === null) return;
    setLoading(true);
    setError(null);
    try {
      const result = await clientFetch<QcResultsWithLotResponseDto>(
        `/api/v1/qc-results?lotId=${lotId}`,
        {},
        token,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch QC results');
    } finally {
      setLoading(false);
    }
  }, [lotId, token]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { data, loading, error, refetch: fetchResults };
}
