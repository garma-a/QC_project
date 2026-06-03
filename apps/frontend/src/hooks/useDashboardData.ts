'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcResultResponseDto,
  QcResultsWithLotResponseDto,
  QcTestResponseDto,
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

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['monitor-dashboard', token],
    queryFn: async ({ signal }) => {
      const fetchedMachines = await clientFetch<MachineResponseDto[]>('/api/v1/machines', { signal }, token);
      
      let categories: { id: string; name: string }[] = [];
      let qcHistory: MonitorResultEntry[] = [];
      let machines: DashboardData['machines'] = [];

      if (fetchedMachines && fetchedMachines.length > 0) {
        const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
        categories = sectionIds.map((sid) => ({
          id: sid.toString(),
          name: `Section ${sid}`,
        }));

        const [allLots, testsByMachine] = await Promise.all([
          clientFetch<ControlLotResponseDto[]>('/api/v1/control-lots', { signal }, token).catch(() => []),
          Promise.all(
            fetchedMachines.map(async (machine) => {
              try {
                const tests = await clientFetch<QcTestResponseDto[]>(
                  `/api/v1/qc-tests/machine/${machine.id}`,
                  { signal },
                  token
                );
                return { machineId: machine.id, tests };
              } catch (err) {
                console.error(`Failed to fetch tests for machine ${machine.id}:`, err);
                return { machineId: machine.id, tests: [] as QcTestResponseDto[] };
              }
            })
          ),
        ]);

        const testById = new Map<number, { machineId: number; test: QcTestResponseDto }>();
        for (const machineTests of testsByMachine) {
          for (const test of machineTests.tests) {
            testById.set(test.id, { machineId: machineTests.machineId, test });
          }
        }

        const lotsWithContext = allLots
          .map((lot) => {
            const testContext = testById.get(lot.testId);
            return testContext ? { lot, ...testContext } : null;
          })
          .filter((item): item is { lot: ControlLotResponseDto; machineId: number; test: QcTestResponseDto } => item !== null);

        const lotResults = await Promise.all(
          lotsWithContext.map(async (ctx) => {
            try {
              const response = await clientFetch<QcResultsWithLotResponseDto>(
                `/api/v1/qc-results?lotId=${ctx.lot.id}&limit=1000`,
                { signal },
                token
              );
              const results = Array.isArray(response.results) ? response.results : [];
              return { ctx, results };
            } catch (err) {
              console.error(`Failed to fetch QC results for lot ${ctx.lot.id}:`, err);
              return { ctx, results: [] as QcResultResponseDto[] };
            }
          })
        );

        qcHistory = lotResults.flatMap(({ ctx, results }) =>
          results.map((result) => {
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
          })
        );

        machines = fetchedMachines.map((machine) => {
          const machineResults = qcHistory
            .filter((entry) => entry.machineId === machine.id)
            .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
          const latestResult = machineResults[0];

          const machineTestsData = testsByMachine.find(t => t.machineId === machine.id)?.tests || [];
          const machineLots = lotsWithContext.filter((ctx) => ctx.machineId === machine.id);
          
          const tests = machineTestsData.flatMap((test) => {
            const testLots = machineLots.filter(ctx => ctx.test.id === test.id);
            if (testLots.length > 0) {
              return testLots.map(ctx => ({
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
            testsToday: machine.testsToday ?? machineResults.length,
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
  });

  return {
    data,
    isLoading: isLoading || !token,
    error: token ? error?.message || null : null,
  };
}
