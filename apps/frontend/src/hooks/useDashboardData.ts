'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  EnrichedControlLotResponseDto,
  EnrichedQcResultResponseDto,
  MachineResponseDto,
} from '@/lib/types/api';

export type MonitorResultEntry = EnrichedQcResultResponseDto & {
  /** Formatted display date string (e.g. "6/14/2026 02:30 PM") */
  date: string;
  /** Formatted expected range string (e.g. "96.5 - 106.5") */
  expectedRange: string;
  /** Alias: lot control level (1, 2, or 3) */
  level: number;
  /** Alias: lot mean value */
  lotMean: number;
  /** Alias: lot standard deviation */
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
       * SCALABLE DESIGN:
       *
       * 1. GET /api/v1/machines          — 4 rows (always small)
       * 2. GET /api/v1/control-lots?isActive=true
       *    — Returns ONLY active lots (~56 rows) enriched with testName, testType, machineId
       *      via a server-side JOIN. No separate /qc-tests call needed.
       *      Scales to 1M+ lots because isActive filter keeps the result set tiny.
       * 3. GET /api/v1/qc-results        — latest 100 results enriched with lot/test/machine
       *      context via server-side JOINs. Capped at 100 rows regardless of total data size.
       *      For 100K+ rows, only the latest 100 are returned — fast and lightweight.
       */
      const [fetchedMachines, activeLots, allResultsResponse] = await Promise.all([
        clientFetch<MachineResponseDto[]>('/api/v1/machines', { signal }, token).catch(() => []),
        clientFetch<EnrichedControlLotResponseDto[]>(
          '/api/v1/control-lots?isActive=true',
          { signal },
          token,
        ).catch(() => []),
        clientFetch<{ results: EnrichedQcResultResponseDto[] }>(
          '/api/v1/qc-results',
          { signal },
          token,
        ).catch(() => ({ results: [] })),
      ]);

      const allResults: EnrichedQcResultResponseDto[] = Array.isArray(allResultsResponse?.results)
        ? allResultsResponse.results
        : [];

      let categories: { id: string; name: string }[] = [];
      let qcHistory: MonitorResultEntry[] = [];
      let machines: DashboardData['machines'] = [];

      if (fetchedMachines && fetchedMachines.length > 0) {
        // Build section categories from machines
        const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
        categories = sectionIds.map((sid) => ({
          id: sid.toString(),
          name: `Section ${sid}`,
        }));

        /**
         * Build qcHistory directly from enriched results.
         * No cross-referencing needed — machineId, testName, lot details
         * are all embedded in each result by the backend JOIN.
         */
        qcHistory = allResults.map((result): MonitorResultEntry => {
          const dateObj = new Date(result.testDate as string);
          const dateStr = !Number.isNaN(dateObj.getTime())
            ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'N/A N/A';

          return {
            ...result,
            level: result.lotLevel ?? 1,
            lotMean: result.lotMean ?? 0,
            lotSd: result.lotSd ?? 1,
            expectedRange: `${result.lowerControlLimit ?? 0} - ${result.upperControlLimit ?? 0}`,
            date: dateStr,
          };
        });

        /**
         * Build machine entries from:
         * - fetchedMachines (base machine data)
         * - activeLots filtered per machine (for test/lot definitions)
         * - qcHistory filtered per machine (for "last QC" and "tests today")
         *
         * activeLots has machineId + testName + testType already embedded.
         */
        machines = fetchedMachines.map((machine) => {
          const machineResults = qcHistory
            .filter((entry) => entry.machineId === machine.id)
            .sort((a, b) => new Date(b.testDate as string).getTime() - new Date(a.testDate as string).getTime());
          const latestResult = machineResults[0];

          // Filter active lots that belong to this machine
          const machineLots = activeLots.filter((lot) => lot.machineId === machine.id);

          // Each active lot maps to one entry in the tests array
          const tests = machineLots.map((lot) => ({
            id: lot.testId.toString(),
            name: lot.testName,
            category: lot.testType ?? 'General',
            code: lot.testId.toString(),
            unit: 'unit',
            lowRange: lot.lowerControlLimit ?? 0,
            highRange: lot.upperControlLimit ?? 0,
            lotId: lot.id,
            level: lot.level ?? 1,
            lotNumber: lot.lotNumber,
            mean: lot.mean ?? 0,
            standardDeviation: lot.standardDeviation ?? 0,
            isActive: lot.isActive ?? true,
          }));

          return {
            ...machine,
            testsToday: machineResults.length,
            lastQC: latestResult
              ? {
                  date: new Date(latestResult.testDate as string).toLocaleString(),
                  status:
                    latestResult.status === 'PASS'
                      ? 'pass'
                      : latestResult.status === 'WARNING'
                        ? 'warning'
                        : 'error',
                }
              : { date: 'N/A', status: 'pass' },
            tests,
          };
        });
      }

      return { machines, categories, qcHistory };
    },
    enabled: !!token,
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  return {
    data,
    isLoading: isLoading || !token,
    isFetching,
    error: token ? error?.message || null : null,
  };
}
