'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  MachineResponseDto,
  EnrichedQualityControlResultResponseDto,
} from '@/lib/types/api';

export type MonitorResultEntry = EnrichedQualityControlResultResponseDto & {
  date: string;
  expectedRange: string;
  level: number;
  lotMean: number;
  lotSd: number;
};

export interface DashboardData {
  machines: (MachineResponseDto & {
    testsToday?: number;
    lastQC?: { date: string; status: string };
    tests?: {
      id: string;
      name: string;
      category: string;
      code: string;
      unit: string;
      lowRange: number;
      highRange: number;
      lotId: number;
      level: number;
      lotNumber: string;
      isActive: boolean;
      mean: number;
      standardDeviation: number;
    }[];
  })[];
  categories: { id: string; name: string }[];
  qcHistory: MonitorResultEntry[];
}

export function useDashboardData() {
  const token = useAuthStore((s) => s.accessToken);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      window.location.href = '/login?force=true';
    }
  }, [isHydrated, token]);

  const { data, isLoading, isFetching, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async ({ signal }) => {
      /**
       * BFF DESIGN:
       * 1 request. That's it.
       */
      const response = await clientFetch<DashboardData>('/api/v1/bff/dashboard', { signal }, token).catch((e) => {
        console.error('BFF Fetch Error:', e);
        return null;
      });

      if (!response) {
        throw new Error('Failed to fetch dashboard data from BFF');
      }

      return response;
    },
    enabled: isHydrated && !!token,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 30000, // 30 seconds
  });

  return {
    data: data || null,
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  };
}
