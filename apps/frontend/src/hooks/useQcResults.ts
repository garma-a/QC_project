'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type { QualityControlResultsWithLotResponseDto } from '@/lib/types/api';

interface UseQcResultsReturn {
  data: QualityControlResultsWithLotResponseDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useQcResults(lotId: number | null, startDate?: string, endDate?: string, limit?: number): UseQcResultsReturn {
  const token = useAuthStore((s) => s.accessToken);

  const {
    data = null,
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['qc-results', lotId, startDate, endDate, limit],
    queryFn: ({ signal }) => {
      let url = `/api/v1/qc-results?lotId=${lotId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (limit) url += `&limit=${limit}`;
      
      return clientFetch<QualityControlResultsWithLotResponseDto>(
        url,
        { signal },
        token,
      );
    },
    enabled: lotId !== null && !!token,
    placeholderData: (prev) => prev,
  });

  return {
    data,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch QC results') : null,
    refetch,
  };
}
