'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';

export interface QcPageMachine {
  id: string;
  name: string;
  category: string;
  model: string;
  tests: any[];
}

export interface QcPageCategory {
  id: string;
  name: string;
}

export interface QcPageMachinesData {
  machines: QcPageMachine[];
  categories: QcPageCategory[];
}

export function useQcPageMachines() {
  const token = useAuthStore((s) => s.accessToken);

  const { data, isLoading, isError, error } = useQuery<QcPageMachinesData>({
    queryKey: ['qc-page-machines'],
    queryFn: async ({ signal }) => {
      const res = await clientFetch<QcPageMachinesData>('/api/v1/bff/qc/machines', { signal }, token);
      if (!res) {
        throw new Error('Failed to fetch machines for QC page');
      }
      return res;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: data || { machines: [], categories: [] },
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
  };
}
