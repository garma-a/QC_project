import { api } from '@/lib/api/serverFetch';
import { DashboardInteractive, type MachineWithQcStatus } from '@/features/dashboard/components/DashboardInteractive';
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcResultResponseDto,
  QcResultsWithLotResponseDto,
  QcTestResponseDto,
} from '@/lib/types/api';

export default async function DashboardPage() {
  let machinesWithStatus: MachineWithQcStatus[] = [];
  let categories: { id: string; name: string }[] = [];

  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && Array.isArray(fetchedMachines) && fetchedMachines.length > 0) {
      // Derive categories from unique sectionIds in the machine data
      const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
      categories = sectionIds.map((sid) => ({
        id: sid.toString(),
        name: `Section ${sid}`,
      }));

      // Fetch all QC tests and control lots in parallel (single call each, no N+1)
      const [allTests, allLots] = await Promise.all([
        api.get<QcTestResponseDto[]>('/api/v1/qc-tests').catch(() => [] as QcTestResponseDto[]),
        api.get<ControlLotResponseDto[]>('/api/v1/control-lots').catch(() => [] as ControlLotResponseDto[]),
      ]);

      // Build a map: testId → machineId
      const testMachineMap = new Map<number, number>(
        allTests.map((t) => [t.id, t.machineId]),
      );

      // Fetch results for every lot in parallel
      const lotResultPairs = await Promise.all(
        allLots.map(async (lot) => {
          try {
            const response = await api.get<QcResultsWithLotResponseDto>(
              `/api/v1/qc-results?lotId=${lot.id}`,
            );
            const results: QcResultResponseDto[] = Array.isArray(response.results)
              ? response.results
              : [];
            return { lot, results };
          } catch {
            return { lot, results: [] as QcResultResponseDto[] };
          }
        }),
      );

      // For each machine, find its most recent QC result
      const latestByMachine = new Map<
        number,
        { date: string; status: 'pass' | 'warning' | 'error' }
      >();

      for (const { lot, results } of lotResultPairs) {
        const machineId = testMachineMap.get(lot.testId);
        if (machineId === undefined) continue;

        for (const result of results) {
          const existing = latestByMachine.get(machineId);
          if (!existing || new Date(result.testDate) > new Date(existing.date)) {
            latestByMachine.set(machineId, {
              date: new Date(result.testDate).toLocaleString(),
              status:
                result.status === 'PASS'
                  ? 'pass'
                  : result.status === 'WARNING'
                    ? 'warning'
                    : 'error',
            });
          }
        }
      }

      machinesWithStatus = fetchedMachines.map((m) => ({
        ...m,
        qcStatus: (latestByMachine.get(m.id)?.status ?? 'pass') as 'pass' | 'warning' | 'error',
        violationCount: 0,
        lastQC: latestByMachine.get(m.id) ?? { date: 'N/A' },
      }));
    }
  } catch (err) {
    console.error('Failed to fetch machines via Server Component:', err);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header with Magdi Yacoub Branding */}
      <div className="mb-8">
        <div className="mb-4" />

        {/* Decorative line with heart center branding */}
        <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full" />
      </div>

      <DashboardInteractive
        machinesWithStatus={machinesWithStatus}
        categories={categories}
      />
    </div>
  );
}
