import { api } from '@/lib/api/serverFetch';
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcResultResponseDto,
  QcResultsWithLotResponseDto,
  QcTestResponseDto,
} from '@/lib/types/api';
import { QCHistoryInteractive } from '@/features/qc/components/QCHistoryInteractive';

type MachineType = { id: string; name: string; category: string; model: string };
type CategoryType = { id: string; name: string };
type QcHistoryType = {
  id: string;
  machineId: string;
  testName: string;
  date: string;
  rawDate: string;
  performedBy: string;
  numericResult?: number;
  result: string;
  expectedRange: string;
  status: string;
  notes?: string | null;
};

export default async function QCPage() {
  let machines: MachineType[] = [];
  let categories: CategoryType[] = [];
  let qcHistory: QcHistoryType[] = [];
  let mappedLots: {
    lotId: number;
    lotNumber: string;
    testName: string;
    machineId: number;
    machineName: string;
  }[] = [];

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'N/A N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A N/A';
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      // Map MachineResponseDto to the shape expected by QCHistory/CreateQCTest components
      machines = fetchedMachines.map((m) => ({
        id: m.id.toString(),
        name: m.name,
        category: m.sectionId.toString(),
        model: m.hospCode ?? '',
      }));

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

      mappedLots = lotsWithContext.map(ctx => {
        const machine = machines.find(m => m.id === ctx.machineId.toString());
        return {
          lotId: ctx.lot.id,
          lotNumber: ctx.lot.lotNumber,
          testName: ctx.test.testName,
          machineId: ctx.machineId,
          machineName: machine?.name ?? `Machine #${ctx.machineId}`,
        };
      });

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
        results.map((result) => {
          const low = ctx.lot.lowerControlLimit;
          const high = ctx.lot.upperControlLimit;
          const expectedRange =
            typeof low === 'number' && typeof high === 'number'
              ? `${low.toFixed(2)} - ${high.toFixed(2)}`
              : 'Not set';

          const normalizedStatus = result.status === 'PASS' ? 'pass' : result.status === 'WARNING' ? 'warning' : 'error';

          return {
            id: result.id.toString(),
            machineId: ctx.machineId.toString(),
            testName: ctx.test.testName,
            date: formatDateTime(result.testDate),
            rawDate: result.testDate,
            performedBy: `User #${result.performedBy}`,
            numericResult: result.measuredValue,
            result: result.measuredValue.toFixed(2),
            expectedRange,
            status: normalizedStatus,
            notes: result.comments ?? `Lot: ${ctx.lot.lotNumber}`,
          };
        }),
      );
    }
  } catch {
    console.error("Failed to fetch machines via Server Component");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <QCHistoryInteractive 
        qcHistory={qcHistory} 
        machines={machines} 
        categories={categories}
        lots={mappedLots}
      />
    </div>
  );
}
