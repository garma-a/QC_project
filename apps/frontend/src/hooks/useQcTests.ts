'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { QcTestResponseDto } from '@/lib/types/api';

interface UseQcTestsReturn {
  tests: QcTestResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch all QC tests configured on a specific machine.
 */
export function useQcTests(machineId: number | null): UseQcTestsReturn {
  const [tests, setTests] = useState<QcTestResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  const fetchTests = useCallback(async () => {
    if (machineId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await clientFetch<QcTestResponseDto[]>(
        `/api/v1/qc-tests/machine/${machineId}`,
        {},
        token,
      );
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch QC tests');
    } finally {
      setLoading(false);
    }
  }, [machineId, token]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return { tests, loading, error, refetch: fetchTests };
}
