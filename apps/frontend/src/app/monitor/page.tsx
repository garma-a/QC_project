import { api } from '@/lib/api/serverFetch';
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcResultResponseDto,
  QcResultsWithLotResponseDto,
  QcTestResponseDto,
} from '@/lib/types/api';
import { MonitorClient } from '@/features/machines/components/MonitorClient';

type MonitorResultEntry = QcResultResponseDto & {
  machineId: number;
  testId: number;
  testName: string;
  lotId: number;
  level: number;
  lotNumber: string;
};

export default async function MonitorPage(props: { searchParams: Promise<{ machineId?: string }> }) {
  // SearchParams not explicitly needed yet but kept for next.js interface
  await props.searchParams;

  let machines: (MachineResponseDto & {
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
      mean: number;
      standardDeviation: number;
    }[];
  })[] = [];

  let categories: { id: string; name: string }[] = [];
  let qcHistory: MonitorResultEntry[] = [];

  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      // Derive categories from unique sectionIds
      const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
      categories = sectionIds.map((sid) => ({
        id: sid.toString(),
        name: `Section ${sid}`,
      }));

      const [allLots, testsByMachine] = await Promise.all([
        api.get<ControlLotResponseDto[]>('/api/v1/control-lots').catch(() => []),
        Promise.all(
          fetchedMachines.map(async (machine) => {
            try {
              const tests = await api.get<QcTestResponseDto[]>(
                `/api/v1/qc-tests/machine/${machine.id}`,
              );
              return { machineId: machine.id, tests };
            } catch {
              return { machineId: machine.id, tests: [] as QcTestResponseDto[] };
            }
          }),
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
            const response = await api.get<QcResultsWithLotResponseDto>(
              `/api/v1/qc-results?lotId=${ctx.lot.id}`,
            );
            const results = Array.isArray(response.results)
              ? response.results
              : [];

            return { ctx, results };
          } catch {
            return { ctx, results: [] as QcResultResponseDto[] };
          }
        }),
      );

      qcHistory = lotResults.flatMap(({ ctx, results }) =>
        results.map((result) => ({
          ...result,
          machineId: ctx.machineId,
          testId: ctx.test.id,
          testName: ctx.test.testName,
          lotId: ctx.lot.id,
          level: ctx.lot.level ?? 1,
          lotNumber: ctx.lot.lotNumber,
        })),
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
  } catch {
    console.error("Failed to fetch machines via Server Component");
  }

  return (
    <MonitorClient
      machines={machines}
      categories={categories}
      qcHistory={qcHistory}
    />
  );
}
