'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcResultResponseDto,
  QcResultsWithLotResponseDto,
  QcTestResponseDto,
  SectionResponseDto,
} from '@/lib/types/api';

export type MonitorResultEntry = QcResultResponseDto & {
  machineId: number;
  testId: number;
  testName: string;
  lotId: number;
  level: number;
  lotNumber: string;
  lotMean: number;
  lotSd: number;
  expectedRange: string;
  date: string;
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
      const [fetchedMachines, allLots, allTests, allResultsResponse, fetchedSections] = await Promise.all([
        clientFetch<MachineResponseDto[]>('/api/v1/machines', { signal }, token).catch(() => []),
        clientFetch<ControlLotResponseDto[]>('/api/v1/control-lots', { signal }, token).catch(() => []),
        clientFetch<QcTestResponseDto[]>('/api/v1/qc-tests', { signal }, token).catch(() => []),
        clientFetch<{ results: QcResultResponseDto[] }>('/api/v1/qc-results', { signal }, token).catch(() => ({ results: [] })),
        clientFetch<SectionResponseDto[]>('/api/v1/sections', { signal }, token).catch(() => []),
      ]);

      const allResults = Array.isArray(allResultsResponse.results) ? allResultsResponse.results : [];

      let categories: { id: string; name: string }[] = [];
      let qcHistory: MonitorResultEntry[] = [];
      let machines: DashboardData['machines'] = [];

      if (fetchedMachines && fetchedMachines.length > 0) {
        // Build a lookup map from section ID → real section name
        const sectionNameById = new Map<number, string>();
        for (const section of fetchedSections) {
          sectionNameById.set(section.id, section.name);
        }

        const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
        categories = sectionIds.map((sid) => ({
          id: sid.toString(),
          name: sectionNameById.get(sid) ?? `Section ${sid}`,
        }));

        const testById = new Map<number, QcTestResponseDto>();
        for (const test of allTests) {
          testById.set(test.id, test);
        }

        const lotsWithContext = allLots
          .map((lot) => {
            const test = testById.get(lot.testId);
            return test ? { lot, machineId: test.machineId, test } : null;
          })
          .filter((item): item is { lot: ControlLotResponseDto; machineId: number; test: QcTestResponseDto } => item !== null);

        qcHistory = allResults.map((result) => {
          const ctx = lotsWithContext.find((c) => c.lot.id === result.lotId);
          if (!ctx) return null;

          const dateObj = new Date(result.testDate);
          const dateStr = !Number.isNaN(dateObj.getTime())
            ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'N/A N/A';

          return {
            ...result,
            machineId: ctx.machineId,
            testId: ctx.test.id,
            testName: ctx.test.testName,
            lotId: ctx.lot.id,
            level: ctx.lot.level ?? 1,
            lotNumber: ctx.lot.lotNumber,
            lotMean: ctx.lot.mean ?? 0,
            lotSd: ctx.lot.standardDeviation ?? 1,
            expectedRange: `${ctx.lot.lowerControlLimit ?? 0} - ${ctx.lot.upperControlLimit ?? 0}`,
            date: dateStr,
          };
        }).filter((entry): entry is MonitorResultEntry => entry !== null);

        machines = fetchedMachines.map((machine) => {
          const machineResults = qcHistory
            .filter((entry) => entry.machineId === machine.id)
            .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
          const latestResult = machineResults[0];

          const machineTestsData = allTests.filter((t) => t.machineId === machine.id);
          const machineLots = lotsWithContext.filter((ctx) => ctx.machineId === machine.id);

          const tests = machineTestsData.flatMap((test) => {
            const testLots = machineLots.filter((ctx) => ctx.test.id === test.id);
            if (testLots.length > 0) {
              return testLots.map((ctx) => ({
                id: ctx.test.id.toString(),
                name: ctx.test.testName,
                category: ctx.test.testType ?? 'General',
                code: ctx.test.id.toString(),
                unit: 'unit',
                lowRange: ctx.lot.lowerControlLimit ?? 0,
                highRange: ctx.lot.upperControlLimit ?? 0,
                lotId: ctx.lot.id,
                level: ctx.lot.level ?? 1,
                lotNumber: ctx.lot.lotNumber,
                mean: ctx.lot.mean ?? 0,
                standardDeviation: ctx.lot.standardDeviation ?? 0,
                isActive: ctx.lot.isActive ?? true,
              }));
            } else {
              return [{
                id: test.id.toString(),
                name: test.testName,
                category: test.testType ?? 'General',
                code: test.id.toString(),
                unit: 'unit',
                lowRange: 0,
                highRange: 0,
                lotId: -1,
                level: 1,
                lotNumber: 'No Lot',
                mean: 0,
                standardDeviation: 1,
                isActive: true,
              }];
            }
          });

          return {
            ...machine,
            testsToday: machineResults.length,
            lastQC: latestResult
              ? {
                date: new Date(latestResult.testDate).toLocaleString(),
                status: latestResult.status === 'PASS' ? 'pass' : latestResult.status === 'WARNING' ? 'warning' : 'error',
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
