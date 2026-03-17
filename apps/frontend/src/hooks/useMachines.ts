'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { MachineResponseDto } from '@/lib/types/api';

interface UseMachinesReturn {
  machines: MachineResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMachines(): UseMachinesReturn {
  const [machines, setMachines] = useState<MachineResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientFetch<MachineResponseDto[]>('/api/v1/machines', {}, token);
      setMachines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch machines');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  return { machines, loading, error, refetch: fetchMachines };
}
